module.exports = class extends think.Logic {
  loginAction() {
    this.allowMethods = 'post';
    this.rules = {
      mobile: { required: true, string: true },
      password: { required: true, string: true }
    };
  }
};
