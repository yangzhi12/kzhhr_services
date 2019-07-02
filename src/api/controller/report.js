const Base = require('./base.js');

module.exports = class extends Base {
  /**
   *  action
   * @return {Promise}
   */
  async indexAction() {
    if (!this.isPost) {
      return false;
    }
    const userid = this.getLoginUserId();
    const model = this.model('report');
    const data = await model
      .field(
        `rep.id,
        rep.createtime,
        rep.level as levelno,
        rep.orders,
        rep.orderprice,
        (IFNULL(rep.dirorders, 0) * 400) as dirordersvalue, 
        (IFNULL(rep.indirorders, 0) * 200) as indirordersvalue,
        IFNULL(rep.originmount, 0) as originmount,
        IFNULL(rep.offsetmount, 0) as offsetmount,
        IFNULL(rep.lostmount, 0) as lostmount,
        IFNULL(rep.ismarketman, 0) as ismarketman,
        IFNULL(rep.issaleman, 0) as issaleman,
        IFNULL(rep.lastyearvalue, 0) as lastyearvalue`
      )
      .alias('rep')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['rep.userid', 'us.id']
      })
      .where({ 'rep.userid': ['=', userid] })
      .order(['rep.id DESC'])
      .select();
    if (data.length > 0) {
      data.map(item => {
        // 此处可加入流失率的计算
        // 收益金额 = (自签站点数 * 单价 + 额外奖励(直接下一级 + 直接下二级) + 老客户结算值 * 0.9) [专职业务员 + 15000][公司营销人员 * 0.8]
        // 收益金额根据客户流失率计算相应的结算值（客户流失率大于20%，结算值扣减10%， 流失率大于50%，公司取消资格。存量客户交由上一级代理，所获结算值继续分享50%，代理分享50%）
        let incomevalue = Math.round(item.orders) * item.orderprice;
        const prize = item.dirordersvalue + item.indirordersvalue;
        if (item.ismarketman) {
          incomevalue = Numeric(incomevalue * 0.8, 2);
        }
        return Object.assign(item, {
          orders: Math.round(item.orders),
          incomevalue: incomevalue,
          lostratio: 0,
          prize: prize,
          levelname: this.getLevelName(item.levelno)
        });
      });
      // 整理数据
      const incomes = data.reduce((income, item) => {
        console.log(item.createtime);
        const year = new Date(item.createtime).getFullYear();
        income[`${year}`]
          ? null
          : (income[`${year}`] = { Q1: {}, Q2: {}, Q3: {}, Q4: {} });
        const month = new Date(item.createtime).getMonth();
        const quarder = Math.round(month / 3) + 1;
        income[`${year}`][`Q${quarder}`] = item;
        return income;
      }, {});
      this.success(incomes);
    } else {
      this.success();
    }
  }
};
