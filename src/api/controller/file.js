const Base = require('./base.js');

module.exports = class extends Base {
  async uploadAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    return this.success(values);
  }
}