const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * levelreview action
   * @return {Primise}
   */
  async levelreviewAction() {
    if (!this.isPost) return false;
    let result = null;
    const information = this.post('information') || 3;
    const orders = this.post('orders');
    const expands = this.post('expands');
    const teamorders = this.post('teamorders');
    const trains = this.post('trains');
    const shares = this.post('shares');
    // const lostorders = this.post('lostorders');
    // 评级
    const where = `
      information <= ${information} 
      and orders <= ${orders}
      and trains <= ${trains} 
      and shares <= ${shares}`;
    const model = this.model('level');
    let data = await model
      .where(where)
      .order('id DESC')
      .select();
    // 若未检测到任何记录则默认钻级为业务员
    if (data.length === 0) {
      data = await model
        .order('id')
        .limit(1)
        .select();
      result = data[0];
    } else {
      result = this.reviewTeamOrdersOrExpands(data, teamorders, expands);
    }
    return this.success(result);
  }
};
