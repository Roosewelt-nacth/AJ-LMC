const RSVP = (() => {
  const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwGi9nlNtz8E7LLt9qeOWb5gqSROy_Ax2sJKaizCJwCAptmkHSckoreqroOZRid66fvJQ/exec%27;
 
  let form;
  let submitButton;
  let errorEl;
  let successEl;
  let attendingEl;
  let guestsField;
  let guestsInput;
  let statGuests;
  let statFamilies;
 
  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }
 
  function showMessage(type, message) {
    if (type === 'error') {
      if (successEl) successEl.hidden = true;
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
      return;
    }
 
    if (errorEl) errorEl.hidden = true;
    if (successEl) {
      successEl.textContent = message;
      successEl.hidden = false;
    }
  }
 
  function clearMessages() {
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = true;
  }
 
  function toggleGuestsField() {
    if (!attendingEl || !guestsField || !guestsInput) return;
 
    const isAttending = attendingEl.value === 'yes';
    guestsField.style.display = isAttending ? '' : 'none';
 
    if (!isAttending) {
      guestsInput.value = '1';
    }
  }
 
  async function safeJsonFromResponse(response) {
    const text = await response.text();
 
    try {
      return JSON.parse(text);
    } catch (_) {
      return {
        success: false,
        message: 'Unexpected response from RSVP service',
        raw: text
      };
    }
  }
 
  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE_URL}?action=stats`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      });
 
      const data = await safeJsonFromResponse(response);
 
      if (!data.success || !data.stats) return;
      renderStats(data.stats);
    } catch (_) {}
  }
 
  function renderStats(stats) {
    if (statGuests) statGuests.textContent = String(stats.totalGuestsAttending || 0);
    if (statFamilies) statFamilies.textContent = String(stats.attendingResponses || 0);
  }
 
  function validateForm(payload) {
    if (!payload.name.trim()) {
      return 'Please enter your full name';
    }
 
    if (!payload.phone.trim()) {
      return 'Please enter your phone number';
    }
 
    if (!payload.attending.trim()) {
      return 'Please select your attendance status';
    }
 
    if (payload.attending === 'yes' && (!payload.guestsCount || Number(payload.guestsCount) < 1)) {
      return 'Please enter at least 1 guest';
    }
 
    return '';
  }
 
  function getPayload() {
    const formData = new FormData(form);
 
    return {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      attending: String(formData.get('attending') || '').trim(),
      guestsCount: Number(formData.get('guestsCount') || 1),
      notes: String(formData.get('notes') || '').trim()
    };
  }
 
  async function submitForm(event) {
    event.preventDefault();
    clearMessages();
 
    const payload = getPayload();
    const validationError = validateForm(payload);
 
    if (validationError) {
      showMessage('error', validationError);
      return;
    }
 
    setLoading(true);
 
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
 
      const data = await safeJsonFromResponse(response);
 
      if (!data.success) {
        showMessage('error', data.message || 'Unable to submit RSVP right now');
        setLoading(false);
        return;
      }
 
      showMessage('success', data.message || 'Your RSVP has been received');
 
      if (data.stats) {
        renderStats(data.stats);
      } else {
        fetchStats();
      }
 
      form.reset();
      if (guestsInput) guestsInput.value = '1';
      toggleGuestsField();
    } catch (_) {
      showMessage('error', 'Unable to connect right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }
 
  function setLoading(isLoading) {
    if (!submitButton) return;
 
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Submitting...' : 'Confirm Attendance';
  }
 
  function init() {
    form = qs('#rsvpForm');
    submitButton = qs('#rsvpSubmit');
    errorEl = qs('#rsvpError');
    successEl = qs('#rsvpSuccess');
    attendingEl = qs('#rsvpAttending');
    guestsField = qs('#guestsField');
    guestsInput = qs('#rsvpGuests');
    statGuests = qs('#statGuests');
    statFamilies = qs('#statFamilies');
 
    if (!form) return;
 
    form.addEventListener('submit', submitForm);
 
    if (attendingEl) {
      attendingEl.addEventListener('change', toggleGuestsField);
      toggleGuestsField();
    }
 
    fetchStats();
  }
 
  return { init };
})();