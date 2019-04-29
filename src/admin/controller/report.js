const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * curlevel action
   * @return {Promise}
   */
  async curlevelAction() {
    if (!this.isPost) {
      return false;
    }
    const userid = this.post('userid');
    const startdate = this.post('startdate');
    const enddate = this.post('enddate');
    const model = this.model('report');
    const data = await model
      .field('level as levelno, createtime as leveltime')
      .where(
        `userid = ${userid}
          and createtime >= ${startdate} 
          and createtime < ${enddate}`
      )
      .limit(1)
      .select();
    if (data && data.length > 0) {
      this.success(data[0]);
    } else {
      this.success(Object.assign({}, { levelno: null, leveltime: null }));
    }
  }
  /**
   * getsubrecords action
   * @return {Promise}
   */
  async getsubrecordsAction() {
    if (!this.isPost) {
      return this.fail('钻级评定失败.');
    }
    const refuser = this.post('refuser');
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
    const refuserids = [];
    refuser.map(item => {
      refuserids.push(item.id);
    });
    const start = new Date(qstartdate[quarter]).getTime();
    const end = new Date(qenddate[quarter]).getTime();
    if (refuserids && refuserids.length > 0) {
      const model = this.model('report');
      const data = await model
        .where(
          `userid in (${refuserids})
          and createtime >= ${start} 
          and createtime < ${end}`
        )
        .select();
      if (data.length === refuserids.length) {
        return this.success([]);
      } else {
        const noleveluser = [];
        refuser.map(item => {
          const u = data.filter(d => {
            return d.userid === item.id;
          });
          if (u.length === 0) {
            noleveluser.push(item);
          }
        });
        return this.fail(noleveluser);
      }
    } else {
      return this.success([]);
    }
  }
  /**
   * store action
   * @return {Promise}
   */
  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const year = this.post('year');
    const quarter = this.post('quarter');
    const qstartdate = {
      '1': `${year}-01-01`,
      '2': `${year}-04-01`,
      '3': `${year}-07-01`,
      '4': `${year}-10-01`
    };
    const createtime = new Date(qstartdate[quarter]).getTime();
    const userid = this.post('userid');
    const level = this.post('level');
    const orders = this.post('orders');
    const trains = this.post('trains');
    const shares = this.post('shares');
    const orderprice = this.post('orderprice');
    const contractvalue = this.post('contractvalue');
    const originmout = this.post('originmout');
    const offsetmout = this.post('offsetmout');
    const lostmout = this.post('lostmout');
    const issaleman = this.post('issaleman');
    const ismarketman = this.post('ismarketman');
    const information = this.post('information');
    const teamorders = this.post('teamorders');
    const explevelno = this.post('explevelno');
    const explevelnum = this.post('explevelnum');
    const dirorders = this.post('dirorders');
    const indirorders = this.post('indirorders');
    const insertsql = Object.assign(
      {},
      {
        userid: userid,
        createtime: createtime,
        level: level,
        orders: orders,
        trains: trains,
        shares: shares,
        orderprice: orderprice,
        contractvalue: contractvalue,
        originmout: originmout,
        offsetmout: offsetmout,
        lostmout: lostmout,
        issaleman: issaleman,
        ismarketman: ismarketman,
        information: information,
        teamorders: teamorders,
        explevelno: explevelno,
        explevelnum: explevelnum,
        dirorders: dirorders,
        indirorders: indirorders
      }
    );
    const wheresql = Object.assign(
      {},
      {
        userid: userid,
        createtime: createtime
      }
    );
    const model = this.model('report');
    const data = await model.thenAdd(insertsql, wheresql);
    this.success(data);
  }
  /**
   * index action
   * @return {Promise}
   */
  async indexAction() {
    if (!this.isPost) {
      return false;
    }
    const year = this.post('year');
    const quarter = this.post('quarter');
    const mobile = this.post('mobile') || '';
    const username = this.post('username') || '';
    const page = this.post('page') || 1;
    const size = this.post('size') || 10;
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
    const startdate = new Date(qstartdate[quarter]).getTime();
    const enddate = new Date(qenddate[quarter]).getTime();
    const model = this.model('report');
    const data = await model
      .field(
        `rep.id,
        rep.userid,
        us.username,
        us.mobile,
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
      .where(
        "(us.mobile like '%" +
          `${mobile}` +
          "%'" +
          " or us.username like '%" +
          `${username}` +
          "%')" +
          ' and (rep.createtime >=' +
          `${startdate} and ` +
          'rep.createtime <' +
          `${enddate})`
      )
      .order(['rep.id ASC'])
      .page(page, size)
      .countSelect();
    if (data.data.length > 0) {
      data.data.map(item => {
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
          prize: prize
        });
      });
    }
    this.success(data);
  }
};
