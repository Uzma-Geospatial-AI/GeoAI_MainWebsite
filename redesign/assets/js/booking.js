(() => {
  const dialog = document.getElementById('booking-dialog');
  const frame = dialog.querySelector('iframe');
  let opener;
  document.querySelectorAll('[data-booking]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      if (!frame.src) {
        const url = new URL(frame.dataset.bookingUrl);
        url.searchParams.set('embed_domain', location.hostname);
        url.searchParams.set('hide_event_type_details', '1');
        frame.src = url.href;
      }
      dialog.showModal();
      document.body.classList.add('booking-open');
      dialog.querySelector('.booking-close').focus();
    });
  });
  dialog.querySelector('.booking-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('booking-open'); opener?.focus(); });
})();
