const RSVP = (() => {
  const API_BASE_URL =
    'https://script.google.com/macros/s/AKfycbwGi9nlNtz8E7LLt9qeOWb5gqSROy_Ax2sJKaizCJwCAptmkHSckoreqroOZRid66fvJQ/exec';

  const REQUEST_TIMEOUT_MS = 15000;
  const MAX_GUESTS = 10;

  let form;
  let submitButton;
  let errorEl;
  let successEl;
  let attendingEl;
  let guestsField;
  let guestsInput;
  let statsContainer;
  let statGuests;
  let statFamilies;

  let modal;
  let modalDialog;
  let modalText;
  let modalStatGuests;
  let modalStatFamilies;
  let modalClose;
  let modalDone;
  let lastFocusedBeforeModal = null;
  let isSubmitting = false;

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
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

  function setFieldInvalid(input, errorId, message) {
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const err = errorId ? qs(`#${errorId}`) : null;
    if (err) {
      err.textContent = message || '';
      err.hidden = !message;
    }
  }

  function clearFieldInvalid(input, errorId) {
    if (!input) return;
    input.setAttribute('aria-invalid', 'false');
    const err = errorId ? qs(`#${errorId}`) : null;
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
  }

  function clearAllFieldErrors() {
    qsa('.rsvp__input, .rsvp__textarea', form).forEach(el => {
      el.setAttribute('aria-invalid', 'false');
    });
    qsa('.field-error', form).forEach(el => {
      el.textContent = '';
      el.hidden = true;
    });
  }

  function toggleGuestsField() {
    if (!attendingEl || !guestsField || !guestsInput) return;

    const isAttending = attendingEl.value === 'yes';

    guestsField.style.display = isAttending ? '' : 'none';
    guestsInput.disabled = !isAttending;
    guestsInput.required = isAttending;

    if (!isAttending) {
      guestsInput.value = '0';
      clearFieldInvalid(guestsInput, 'rsvpGuestsError');
    } else if (Number(guestsInput.value) < 1) {
      guestsInput.value = '1';
    }
  }

  function isValidEmail(value) {
    if (!value) return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function isValidPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }

  function validateForm(payload) {
    clearAllFieldErrors();
    let firstInvalid = null;

    const mark = (input, errorId, message) => {
      setFieldInvalid(input, errorId, message);
      if (!firstInvalid && input) firstInvalid = input;
    };

    const nameInput = qs('#rsvpName');
    const phoneInput = qs('#rsvpPhone');
    const emailInput = qs('#rsvpEmail');
    const attendingInput = qs('#rsvpAttending');

    if (!payload.name.trim()) {
      mark(nameInput, 'rsvpNameError', 'Please enter your full name');
    } else if (payload.name.trim().length < 2) {
      mark(nameInput, 'rsvpNameError', 'Name looks too short');
    }

    // Phone & email are optional — only validate format when provided
    if (payload.phone && !isValidPhone(payload.phone)) {
      mark(phoneInput, 'rsvpPhoneError', 'Enter a valid phone number (8–15 digits)');
    }

    if (payload.email && !isValidEmail(payload.email)) {
      mark(emailInput, 'rsvpEmailError', 'Enter a valid email address');
    }

    if (!payload.attending) {
      mark(attendingInput, 'rsvpAttendingError', 'Please select your attendance status');
    }

    if (payload.attending === 'yes') {
      const count = Number(payload.guestsCount);
      if (!count || count < 1) {
        mark(guestsInput, 'rsvpGuestsError', 'Please enter at least 1 guest');
      } else if (count > MAX_GUESTS) {
        mark(guestsInput, 'rsvpGuestsError', `Maximum ${MAX_GUESTS} guests allowed`);
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return 'Please correct the highlighted fields';
    }

    return '';
  }

  function getPayload() {
    const formData = new FormData(form);
    const attending = String(formData.get('attending') || '').trim();
    let guestsCount = Number(formData.get('guestsCount') || 0);

    // Force guest count to 0 when not attending
    if (attending !== 'yes') {
      guestsCount = 0;
    }

    return {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      attending,
      guestsCount,
      notes: String(formData.get('notes') || '').trim()
    };
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

  function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { ...options, signal: controller.signal }).finally(() => {
      clearTimeout(timer);
    });
  }

  async function fetchStats() {
    if (statsContainer) statsContainer.hidden = true;

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}?action=stats`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('RSVP stats request failed:', response.status);
        return;
      }

      const data = await safeJsonFromResponse(response);

      if (!data.success || !data.stats) {
        console.warn('RSVP stats response incomplete');
        return;
      }

      renderStats(data.stats);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('RSVP stats request timed out');
      } else {
        console.warn('RSVP stats error:', err.message || err);
      }
    }
  }

  function renderStats(stats) {
    const guests = String(stats.totalGuestsAttending || 0);
    const families = String(stats.attendingResponses || 0);

    if (statGuests) statGuests.textContent = guests;
    if (statFamilies) statFamilies.textContent = families;
    if (modalStatGuests) modalStatGuests.textContent = guests;
    if (modalStatFamilies) modalStatFamilies.textContent = families;

    if (statsContainer) statsContainer.hidden = false;
  }

  function getThankYouText(payload) {
    if (payload.attending === 'yes') {
      return `Thank you, ${payload.name}. Your RSVP has been received with joy. We look forward to celebrating this special moment with you.`;
    }
    if (payload.attending === 'no') {
      return `Thank you, ${payload.name}. We’ve received your response. You will be warmly remembered in our celebration.`;
    }
    return `Thank you, ${payload.name}. We’ve received your response and appreciate your time.`;
  }

  function getFocusable(container) {
    return qsa(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  function trapFocus(event) {
    if (!modal || !modal.classList.contains('is-open') || event.key !== 'Tab') return;

    const focusable = getFocusable(modalDialog || modal);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openModal(text) {
    if (!modal) return;

    lastFocusedBeforeModal = document.activeElement;

    if (modalText) modalText.textContent = text;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rsvp-modal-open');

    // Prefer focusing the primary action
    const focusTarget = modalDone || modalClose || modalDialog;
    if (focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rsvp-modal-open');

    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    }
    lastFocusedBeforeModal = null;
  }

  function bindModal() {
    modal = qs('#rsvpThanksModal');
    modalDialog = modal ? qs('.rsvp-modal__dialog', modal) : null;
    modalText = qs('#rsvpThanksText');
    modalStatGuests = qs('#modalStatGuests');
    modalStatFamilies = qs('#modalStatFamilies');
    modalClose = qs('#rsvpModalClose');
    modalDone = qs('#rsvpModalDone');

    if (!modal) return;

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalDone) modalDone.addEventListener('click', closeModal);

    qsa('[data-rsvp-close="true"]', modal).forEach(el => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
      trapFocus(event);
    });
  }

  function setLoading(isLoading) {
    isSubmitting = isLoading;
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Submitting...' : 'Confirm Attendance';
    submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  async function submitForm(event) {
    event.preventDefault();
    clearMessages();

    if (isSubmitting) return;

    const payload = getPayload();
    const validationError = validateForm(payload);

    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithTimeout(API_BASE_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        showMessage('error', 'Unable to submit RSVP right now. Please try again.');
        setLoading(false);
        return;
      }

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

      openModal(getThankYouText(payload));

      form.reset();
      if (guestsInput) guestsInput.value = '1';
      toggleGuestsField();
      clearAllFieldErrors();
    } catch (err) {
      if (err.name === 'AbortError') {
        showMessage('error', 'The request timed out. Please check your connection and try again.');
      } else {
        showMessage('error', 'Unable to connect right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function init() {
    form = qs('#rsvpForm');
    submitButton = qs('#rsvpSubmit');
    errorEl = qs('#rsvpError');
    successEl = qs('#rsvpSuccess');
    attendingEl = qs('#rsvpAttending');
    guestsField = qs('#guestsField');
    guestsInput = qs('#rsvpGuests');
    statsContainer = qs('#rsvpStats');
    statGuests = qs('#statGuests');
    statFamilies = qs('#statFamilies');

    bindModal();

    if (!form) return;

    // Hide stats until a successful load
    if (statsContainer) statsContainer.hidden = true;

    form.addEventListener('submit', submitForm);

    if (attendingEl) {
      attendingEl.addEventListener('change', toggleGuestsField);
      toggleGuestsField();
    }

    // Live-clear field errors on input
    qsa('.rsvp__input, .rsvp__textarea', form).forEach(el => {
      el.addEventListener('input', () => {
        const errorId = el.getAttribute('aria-describedby');
        if (errorId) clearFieldInvalid(el, errorId);
      });
    });

    fetchStats();
  }

  return { init };
})();
