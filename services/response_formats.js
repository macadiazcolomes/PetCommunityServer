class ServerResponse {
  form(control, validator) {
    return { type: 'form', control: control, data: validator };
  }
  toast(message) {
    return { type: 'toast', control: null, data: message };
  }
}

module.exports = new ServerResponse();
