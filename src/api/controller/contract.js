const Base = require('./base.js');

module.exports = class extends Base {
  async infoAction() {
    const id = this.get('id');
    const model = this.model('contract')
      .field([
        'con.id',
        'con.contractname',
        'con.contractno',
        'con.contractvalue',
        'con.recommendvalue',
        'con.contractstart',
        'con.contractend',
        'con.contractstate',
        'con.userid',
        'us.username',
        'con.industry',
        'con.transformer',
        'con.voltage',
        'con.plan'
      ])
      .alias('con')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'con.userid']
      });
    const data = await model.where({ 'con.id': id }).find();
    return this.success(data);
  }
  /**
   * store action 新增签单
   */
  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    Object.assign(values, {
      createtime: parseInt(new Date().getTime() / 1000)
    });
    const model = this.model('contract');
    if (values.id && values.id > 0) {
      await model
        .where({
          id: values.id,
          updatetime: parseInt(new Date().getTime() / 1000)
        })
        .update(values);
    } else {
      Object.assign(values, {
        contractstate: '010',
        createtime: parseInt(new Date().getTime() / 1000),
        userid: this.getLoginUserId()
      });
      delete values.id;
      const id = await model.add(values);
      const contractfiles = values.contractfiles;
      if (id && contractfiles && contractfiles.length > 0) {
        // 归并电气主接线图
        var cachearray = null;
        if (values.wiringdiagrams && values.wiringdiagrams.length > 0) {
          cachearray = contractfiles.concat(values.wiringdiagrams);
        } else {
          cachearray = contractfiles;
        }
        // 如果合同附件存在则插入合同附件
        const filemodel = this.model('contract_attachment');
        cachearray.map(file => {
          delete file.path;
          Object.assign(file, { contractid: id });
          return file;
        });
        await filemodel.addMany(cachearray);
      }
    }
    return this.success(values);
  }
  /**
   * fee action 计算费用
   * @return {Promise} {}
   */
  async feeAction() {
    if (!this.isPost) {
      return false;
    }
    // 输入参数
    const industry = this.post('industry');
    var transformer = this.post('transformer');
    const plan = this.post('plan');
    const planno = plan.substr(0, 2); // 提取方案代号
    const fields = [
      `intr.industryratio`,
      `feefactor${planno}`,
      `ROUND( 1 / POWER( ${Number(transformer)} / intr.capacityconstant, intr.factor ), 2 )  AS capacityratio`,
      `ROUND(ROUND( 1 / POWER( ${Number(transformer)} / intr.capacityconstant, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)  AS feeratio`,
      `ROUND(${Number(transformer)} * intr.totalusehoursyear * intr.powerratio)  AS totalquantity`,
      `intr.feeunitprice`,
      `ROUND(intr.feeunitprice * ROUND(${Number(transformer)} * intr.totalusehoursyear * intr.powerratio)) AS totalfee`,
      `ROUND(ROUND(intr.feeunitprice * ROUND(${Number(transformer)} * intr.totalusehoursyear * intr.powerratio)) * ROUND(ROUND( 1 / POWER( ${Number(transformer)} / intr.capacityconstant, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)) AS fee`,
      `FLOOR(ROUND(ROUND(intr.feeunitprice * ROUND(${Number(transformer)} * intr.totalusehoursyear * intr.powerratio)) * ROUND(ROUND( 1 / POWER( ${Number(transformer)} / intr.capacityconstant, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)) / 1000)*1000 as recommendfee`
    ];
    const model = this.model('industry')
      .alias('intr')
    const data = await model
      .field(fields)
      .where(
        `intr.industryno='${industry}'`
      )
      .find();
    return this.success(data);
  }
  /**
   * statq action 根据签单人按季度签单量
   * @return {Promise} {}
   */
  async statqAction() {
    if (!this.isPost) {
      return false;
    }
    // 输入参数
    const userid = this.getLoginUserId(); // 签单人
    const year = this.post('year'); // 所选年份（字符串）
    const quarter = this.post('quarter'); // 所选季度（1, 2, 3, 4）
    const nextquarter = {
      '1': `${year}-04-01`,
      '2': `${year}-07-01`,
      '3': `${year}-10-01`,
      '4': `${Number(year) + 1}-01-01`
    };
    const enddate = nextquarter[`${quarter}`];
    // 返回字段
    const fields = [
      `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') as year`,
      `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) as Q`,
      `COUNT(*) as amount`,
      `sum(contractvalue)  as contractvalue`,
      `sum(recommendvalue)  as recommendvalue`
    ];
    const model = this.model('contract');
    const data = await model
      .field(fields)
      .where(
        `userid=${userid} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) < '${enddate}' and  Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') <= ${year}`
      )
      .group(
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y'),QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d'))`
      )
      .select();
    // Q: 季度 Y: 年度 R: 累计
    // T: 合同个数 M: 合同金额 N: 基准单数(金额大于3000分为两单)
    const res = {
      QT: 0,
      QM: 0,
      QMR: 0,
      QN: 0,
      YT: 0,
      YM: 0,
      YMR: 0,
      YN: 0,
      RT: 0,
      RM: 0,
      RMR: 0,
      RN: 0
    };
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        res['RT'] += data[i].amount;
        res['RM'] += data[i].contractvalue;
        res['RMR'] += data[i].contractvalue;
        res['RN'] += data[i].contractvalue / 30000;
        if (data[i].year === `${year}`) {
          // 汇总年度
          res['YT'] += data[i].amount;
          res['YM'] += data[i].contractvalue;
          res['YMR'] += data[i].contractvalue;
          res['YN'] += data[i].contractvalue / 30000;
          if (`${data[i].Q}` === `${quarter}`) {
            // 按季度统计
            res['QT'] += data[i].amount;
            res['QM'] += data[i].contractvalue;
            res['QMR'] += data[i].contractvalue;
            res['QN'] += data[i].contractvalue / 30000;
          }
        }
      }
    }
    return this.success(res);
  }
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    if (!this.isPost) {
      return false;
    }
    const year = this.post('year') || '';
    const quarter = this.post('quarter') || '';
    const userid = this.getLoginUserId();
    const model = this.model('contract');
    const data = await model
      .field([
        'con.id',
        'con.contractno',
        'con.contractname',
        'con.contractvalue',
        'con.recommendvalue',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y-%m-%d') as contractstart`,
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractend)=13, con.contractend/1000, con.contractend)), '%Y-%m-%d') as contractend`,
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
        `con.userid=${userid} and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y') = ${year} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y-%m-%d')) = ${quarter}`
      )
      .order(['con.id DESC'])
      .select();
    return this.success(data);
  }
  /**
   * teamq action
   * @return {Promise} []
   */
  async teamindexAction() {
    if (!this.isPost) {
      return false;
    }
    const year = this.post('year') || '';
    const userid = this.getLoginUserId();
    const model = this.model('contract');
    const users = await model.getRefuserList(userid, year);
    return this.success(users);
  }
  /**
   * statteamq action 根据团队按季度签单量
   * @return {Promise} {}
   */
  async statteamqAction() {
    if (!this.isPost) {
      return false;
    }
    // 输入参数
    const userid = this.getLoginUserId(); // 签单人
    const year = this.post('year'); // 所选年份（字符串）
    const quarter = this.post('quarter'); // 所选季度（1, 2, 3, 4）
    const nextquarter = {
      '1': `${year}-04-01`,
      '2': `${year}-07-01`,
      '3': `${year}-10-01`,
      '4': `${Number(year) + 1}-01-01`
    };
    const enddate = nextquarter[`${quarter}`];
    const model = this.model('contract');
    // 获取我的团队成员
    const users = await model.getRefuserList(userid);
    const userids = users.map(user => {
      return user.id;
    });
    // 返回字段
    const fields = [
      `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') as year`,
      `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) as Q`,
      `count(*) as amount`,
      `sum(contractvalue)  as contractvalue`
    ];
    const data = await model
      .field(fields)
      .where(
        `userid in (${userids}) and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) < '${enddate}' and  Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') <= ${year}`
      )
      .group(
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y'),QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d'))`
      )
      .select();
    // Q: 季度 Y: 年度 R: 累计
    // T: 合同个数 M: 合同金额 N: 基准单数(金额大于3000分为两单)
    const res = {
      QT: 0,
      QM: 0,
      QMR: 0,
      QN: 0,
      YT: 0,
      YM: 0,
      YMR: 0,
      YN: 0,
      RT: 0,
      RM: 0,
      RMR: 0,
      RN: 0
    };
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        res['RT'] += data[i].amount;
        res['RM'] += data[i].contractvalue;
        res['RN'] += data[i].contractvalue / 30000;
        if (data[i].year === `${year}`) {
          // 汇总年度
          res['YT'] += data[i].amount;
          res['YM'] += data[i].contractvalue;
          res['YN'] += data[i].contractvalue / 30000;
          if (`${data[i].Q}` === `${quarter}`) {
            // 按季度统计
            res['QT'] += data[i].amount;
            res['QM'] += data[i].contractvalue;
            res['QN'] += data[i].contractvalue / 30000;
          }
        }
      }
    }
    const userq = await model.getquser(userid, year, enddate, quarter);
    Object.assign(res, { QP: userq.QP, YP: userq.YP, RP: userq.RP });
    return this.success(res);
  }
};
