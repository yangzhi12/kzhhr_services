const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * qlevel action
   * @return {Promise} []
   */
  async qlevelAction() {
    const page = this.post('page') || 1;
    const size = this.post('size') || 10;
    const mobile = this.post('mobile') || '';
    const username = this.post('username') || '';
    const year = this.post('year'); // 所选年份（字符串）
    const qstartdate = {
      '1': `${year}-01-01`,
      '2': `${year}-04-01`,
      '3': `${year}-07-01`,
      '4': `${year}-10-01`
    };
    const qenddate = {
      '1': `${year}-04-01`,
      '2': `${year}-07-01`,
      '3': `${year}-10-01`,
      '4': `${Number(year) + 1}-01-01`
    };
    // const model = this.model('report');
    // // 生成报表初始化数据
    // const ireport = await model.initReport(
    //   mobile,
    //   username,
    //   qstartdate,
    //   qenddate
    // );
    return this.success();
  }
};
