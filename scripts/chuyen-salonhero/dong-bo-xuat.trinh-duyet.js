// CHẠY TRONG TRÌNH DUYỆT (tab SalonHero đã đăng nhập, do dong-bo-dem.mjs tự mở tab MỚI). CHỈ ĐỌC: chỉ gọi hàm lấy dữ liệu của SalonHero, không ghi gì.
// Bản này được dong-bo-dem.mjs thay `__THAM_SO__` bằng JSON tham số rồi gửi vào tab. Dữ liệu ra hàng đợi window.__E, dong-bo-dem.mjs kéo từng mảnh về tệp NDJSON.
// Hai pha:
//  pha 'ds' (danh sách): hoá đơn (danh sách, khoảng [tuDon, denExcl)), lịch hẹn (mọi lịch có ngày hẹn trong các tháng cần), khách (cả danh sách), thẻ (cả danh sách), nhắc chăm sóc (lọc theo mốc).
//  pha 'ct' (chi tiết): chi tiết hoá đơn / khách / thẻ theo danh sách id mà Node đã chọn (mới, đổi, hoặc lệch).
// LƯU Ý (lỗi 28/10): end_date của SalonHero KHÔNG gồm ngày đó → luôn truyền ngày hôm sau (khoảng nửa mở).
((P) => {
  if (window.__E && window.__E.running) return 'dang chay';
  const inj = angular.element(document.body).injector(), rs = inj.get('$rootScope');
  const g = (n) => inj.get(n);
  const MID = rs.currentUser.merchant_id;
  try { Object.defineProperty(window, 'localDbIsReady', { get: () => false, set: () => {}, configurable: true }); } catch { window.localDbIsReady = false; } // luôn lấy từ máy chủ, không dùng bản sao cục bộ
  const E = window.__E = { q: [], pos: 0, running: true, done: false, stat: {}, err: [], phase: 'khoi dong', t0: Date.now(),
    take2(ack, step = 900000) { if (ack && E.q.length) { const h = E.q[0][1]; E.pos += step; if (E.pos >= h.length) { E.q.shift(); E.pos = 0; } } if (!E.q.length) return ''; const [name, text] = E.q[0]; const piece = text.slice(E.pos, E.pos + step); const last = E.pos + step >= text.length; return name + '\n' + (E.pos === 0 ? 'S' : 'C') + (last ? 'E' : '-') + '\n' + piece; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const withTO = (p, ms = 90000) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms))]);
  const retry = async (f, n = 4) => { for (let i = 0; i < n; i++) { try { return await withTO(f()); } catch (e) { if (i === n - 1) throw e; await sleep(400 * (i + 1)); } } };
  const unwrap = (r) => (r && r.data !== undefined && r.status !== undefined) ? r.data : (r && r.data !== undefined && !Array.isArray(r) ? r.data : r);
  const asArr = (r) => { const d = unwrap(r); if (Array.isArray(d)) return d; if (d && Array.isArray(d.customers)) return d.customers; if (d && Array.isArray(d.data)) return d.data; return []; };
  const waitq = async () => { while (E.q.length > 120) await sleep(150); };
  const B = {};
  const put = (name, line) => { B[name] = (B[name] || '') + line + '\n'; E.stat[name] = (E.stat[name] || 0) + 1; if (B[name].length > 450000) { E.q.push([name, B[name]]); B[name] = ''; } };
  const flushAll = () => { for (const k of Object.keys(B)) if (B[k]) { E.q.push([k, B[k]]); B[k] = ''; } };
  const emit = async (name, rows) => { for (const r of rows) { put(name, JSON.stringify(r)); if (E.q.length > 120) await waitq(); } flushAll(); };
  const pool = async (name, items, conc, fn) => {
    let i = 0;
    await Promise.all(Array.from({ length: conc }, async () => {
      while (i < items.length) { if (E.q.length > 120) await waitq(); const k = i++; try { await fn(items[k], k); } catch (e) { E.err.push([name, String(items[k] && (items[k].id || items[k])), String((e && e.message) || (e && e.messages) || JSON.stringify(e)).slice(0, 120)]); } }
    }));
    flushAll();
  };
  const moc = P.mocIso;
  const sauMoc = (r) => (r.updated_at || r.updatedAt || '') >= moc || (r.created_at || r.createdAt || '') >= moc;

  (async () => {
    try {
      if (P.pha === 'ds') {
        // 1. hoá đơn — danh sách (nhẹ) trong [tuDon, denExcl)
        E.phase = 'hoa_don_ds';
        const ds = [];
        for (let off = 0; ; off += 1000) {
          const r = await retry(() => g('OrderService').getAllOrder({ start_date: P.tuDon, end_date: P.denExcl, limit: 1000, offset: off }));
          const a = asArr(r); if (!a.length) break; ds.push(...a); E.stat.don_ds_dang = ds.length; if (a.length < 1000) break;
        }
        await emit('don_ds', ds.map((l) => ({ id: l.id, order_id: l.order_id, status: l.status, total: l.total, debt: l.debt, amount_paid: l.amount_paid, total_amount_card: l.total_amount_card, customer_id: l.customer_id,
          created_at: l.created_at, updated_at: l.updated_at, location_id: l.location_id, subtotal: l.subtotal, discount: l.discount })));
        // 2. lịch hẹn — từng tháng, khoảng nửa mở; phát cả dòng đầy đủ (Node lọc đổi/mới/lệch)
        E.phase = 'lich_hen';
        for (const [s, e] of P.thangLich) {
          const b = asArr(await retry(() => g('BookingService').getBookingList({ start_date: s, end_date: e, merchant_id: MID })));
          if (b.length) await emit('lich_hen', b);
          put('dem_lich', JSON.stringify([s.slice(0, 7), b.length, b.reduce((o, x) => { o[x.status] = (o[x.status] || 0) + 1; return o; }, {})]));
        }
        flushAll();
        // 3. khách — cả danh sách (nhẹ, không chi tiết)
        E.phase = 'khach';
        const khach = [];
        for (let off = 0; ; off += 500) {
          const a = asArr(await retry(() => g('CustomerService').getCustomerList({ limit: 500, offset: off, search: '', merchant_id: MID })));
          if (!a.length) break; khach.push(...a); E.stat.khach_dang = khach.length; if (a.length < 500) break;
        }
        await emit('khach', khach);
        // 4. thẻ — cả danh sách (không gồm thẻ đã dùng hết / hết hạn: phần đó lấy ở pha 'ct')
        E.phase = 'the';
        await emit('the', asArr(await retry(() => g('MemberCardService').getMemberCardList({}, true))));
        // 5. nhắc chăm sóc — chỉ dòng mới / đổi từ mốc
        E.phase = 'nhac';
        const nhac = asArr(await retry(() => g('ReminderService').getListReminder({}))).filter(sauMoc);
        await emit('nhac_cham_soc', nhac);
        // 6. sổ quỹ (câu 16): dòng tay của 2 sổ (tiền mặt / ngân hàng) × 2 cơ sở trong [tuDon, denExcl); dòng "order_…" (tiền khách trả) AMIA đã có qua thanh toán → bỏ.
        //    getCashBook tính CẢ mốc cuối → lùi 1 ms. Tồn quỹ hiện tại 4 quỹ để đối chiếu (getTotalRevenueByCashAndBank).
        E.phase = 'so_quy';
        const CS = g('CostService');
        const sqTu = new Date(P.tuDon + 'T00:00:00+07:00').toISOString(), sqDen = new Date(new Date(P.denExcl + 'T00:00:00+07:00').getTime() - 1).toISOString();
        for (const loc of [8377, 9202]) {
          for (const at of ['CASH', 'BANK']) {
            try { const d = unwrap(await retry(() => CS.getCashBook({ startDate: sqTu, endDate: sqDen, location_id: loc, merchant_id: MID, account_type: at })));
              await emit('so_quy', (Array.isArray(d) ? d : []).filter((x) => !String(x.id).startsWith('order')).map((x) => ({ ...x, __loc: loc, __at: at })));
              // dòng "order_…" riêng ra tệp gio_thu: chỉ để tra GIỜ THU thật của từng lần khách trả (gio-thanh-toan-sh.mjs → sh_gio_thanh_toan)
              await emit('gio_thu', (Array.isArray(d) ? d : []).filter((x) => String(x.id).startsWith('order')).map((x) => ({ ...x, __loc: loc, __at: at })));
            } catch (e) { E.err.push(['so_quy', `${loc}|${at}`, String((e && e.message) || e).slice(0, 120)]); }
          }
          try { put('ton_quy', JSON.stringify({ loc, ...unwrap(await retry(() => CS.getTotalRevenueByCashAndBank({ location_id: loc, merchant_id: MID }))), luc: new Date().toISOString() })); }
          catch (e) { E.err.push(['ton_quy', String(loc), String((e && e.message) || e).slice(0, 120)]); }
        }
        flushAll();
        put('meta',JSON.stringify({ merchant_id: MID, xuat_luc: new Date().toISOString(), pha: 'ds', tham_so: P }));
      } else if (P.pha === 'ct') {
        E.phase = 'hoa_don_ct';
        await pool('hoa_don', P.donIds, 3, async (id) => { const d = unwrap(await retry(() => g('OrderService').getOrderById({ id }))); put('hoa_don', JSON.stringify({ id, d })); });
        E.phase = 'khach_ct';
        await pool('khach_tong_hop', P.khachIds, 3, async (id) => {
          const d = await retry(() => g('CustomerService').getCustomerById({ customer_id: id })); // tuần tự: tối đa 3 yêu cầu cùng lúc
          const n = await retry(() => g('CustomerService').getNoteByCustomerId({ customer_id: id }));
          put('khach_tong_hop', JSON.stringify({ id, chi_tiet: unwrap(d), ghi_chu: unwrap(n), diem: [], anh: [] }));
        });
        E.phase = 'the_ct';
        const seen = new Set();
        await pool('the_chi_tiet', P.theTheoKhach, 3, async (cid) => {
          const d = unwrap(await retry(() => g('MemberCardService').getMemberCardsByCustomerId({ customerId: cid })));
          if (Array.isArray(d)) for (const c of d) { if (seen.has(c.id)) continue; seen.add(c.id); delete c.is_expired; put('the_chi_tiet', JSON.stringify(c)); }
        });
        await pool('the_chi_tiet', P.theIds, 3, async (id) => {
          if (seen.has(id)) return; const c = unwrap(await retry(() => g('MemberCardService').getMemberCardById(id)));
          if (c && c.id) { seen.add(c.id); put('the_chi_tiet', JSON.stringify(c)); }
        });
        put('meta_ct', JSON.stringify({ xuat_luc: new Date().toISOString(), pha: 'ct' }));
      }
      flushAll();
      E.phase = 'xong'; E.done = true;
    } catch (e) { E.phase = 'LOI ' + String((e && e.message) || JSON.stringify(e)).slice(0, 200); E.fatal = true; }
    E.running = false;
  })();
  return 'started';
})(__THAM_SO__)
