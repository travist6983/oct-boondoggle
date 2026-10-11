// Site forms (class="demo-form"), with the same fields as the live LeadConnector widgets:
//   #demo-form    "Ready to Talk With Renkim Today?" (widget 07LpuJ7IJcHZgH91U4ie): full name,
//                 organization, phone, email, message.
//   #careers-form "Apply today at Renkim!" (widget UbGgRhsOFSzfr1J6Rv6v): the same fields plus a
//                 résumé upload.
//
// TODO(endpoint): this prototype posts nowhere. Implement submitForm() against the real
// endpoints (LeadConnector form API or Renkim's CRM / ATS) before launch, and add spam
// protection (the live widgets use a hidden honeypot field).
async function submitForm(/* formId, data */) {
  return { ok: false, reason: 'endpoint-not-configured' };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initForm() {
  document.querySelectorAll('form.demo-form').forEach(initOne);
}

function initOne(form) {
  const status = form.querySelector('.form-status');

  const check = (input) => {
    const err = document.getElementById(`${input.id}-err`);
    const value = input.value.trim();
    let valid = !input.required || value.length > 0;
    if (valid && input.type === 'email' && value) valid = EMAIL.test(value);
    if (valid && input.type === 'tel' && value) valid = value.replace(/\D/g, '').length >= 7;
    input.setAttribute('aria-invalid', String(!valid));
    if (err) {
      err.hidden = valid;
      if (!valid) input.setAttribute('aria-describedby', err.id);
      else input.removeAttribute('aria-describedby');
    }
    return valid;
  };

  form.querySelectorAll('input[required]').forEach((input) => {
    input.addEventListener('blur', () => input.value && check(input));
    input.addEventListener('input', () => input.getAttribute('aria-invalid') === 'true' && check(input));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input[required]')];
    const results = fields.map(check);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      status.textContent = 'Please complete the required fields.';
      firstInvalid.focus();
      return;
    }
    const res = await submitForm(form.id, new FormData(form));
    status.textContent = res.ok
      ? 'Thank you.'
      : 'Prototype only: the form endpoint is not connected yet.';
  });
}
