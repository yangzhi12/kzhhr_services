const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const page = this.post('page') || 1;
    const size = this.post('size') || 100;
    const no = this.post('no') || '';
    const name = this.post('name') || '';
    const dictname = this.post('dictname') || '';
    if (think.isEmpty(dictname)) {
      return this.fail(401, '请指定字典名称.');
    } else {
      const dicts = [
        'voltage',
        'plantype',
        'planitem',
        'plan',
        'industry'
      ];
      if (dicts.indexOf(dictname) !== -1) {
        const model = this.model(dictname);
        const condition = `(${dictname}no like '%${no}%') OR (${dictname}name like '%${name}%')`;
        const data = await model
          .where(condition)
          .order(['id ASC'])
          .page(page, size)
          .countSelect();
        return this.success(data);
      } else {
        return this.fail(401, '请检查字典名称是否有误.');
      }
    }
  }
};
