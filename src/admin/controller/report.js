const Base = require('./base.js');

module.exports = class extends Base {
  async getsubecordsAction() {
    if (!this.isPost) {
      return this.fail('钻级评定失败.');
    }
    const userid = this.post('userid');
    const refuserids = this.post('refuserids');
    const year = this.post('year'); // 所选年份（字符串）
    const quarter = this.post('quarter');
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
    console.log('dsa');
    if (refuserids && refuserids.length > 0) {
      const model = this.model('report');
      const data = await model
        .where(
          `userid in (${refuserids})
          and createtime > ${qstartdate[quarter]} 
          and createtime < ${qenddate[quarter]}`
        )
        .count();
      if (data !== refuserids.length) {
        return this.fail('请先确定下级成员钻级.');
      }
    } else {
      console.log(userid);
      return this.success(userid);
    }
  }
};
