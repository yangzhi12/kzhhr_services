const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const content = {
      content: 'everytings is ok!'
    }
    return this.json(content);
  }
};
