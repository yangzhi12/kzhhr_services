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
};
