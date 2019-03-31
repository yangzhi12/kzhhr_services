const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.post('page') || 1;
    const size = this.post('size') || 10;
    const no = this.post('no') || '';
    const name = this.post('name') || '';
    const model = this.model('contract');
    const data = await model
      .field([
        'con.id',
        'con.contractno',
        'con.contractname',
        'con.contractvalue',
        'con.contractstart',
        'con.contractend',
        'us.username',
        'con.contractstate'
      ])
      .alias('con')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'con.userid']
      })
      .where(
        "(con.contractno like '%" +
          `${no}` +
          "%')" +
          "OR (con.contractname like '%" +
          `${name}` +
          "%')"
      )
      .order(['con.id DESC'])
      .page(page, size)
      .countSelect();

    return this.success(data);
  }
};
