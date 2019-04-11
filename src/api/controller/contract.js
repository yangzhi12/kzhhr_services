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
   * state action
   * @return {Promise} {}
   */
  async stateAction() {
    const id = this.post('id');
    const curuserid = this.post('userid');
    const state = this.post('state');
    const updateState = Object.assign(
      {},
      {
        updatetime: parseInt(new Date().getTime() / 1000)
      }
    );
    switch (state.substr(0, 2)) {
      case '01': // 技术评审
        Object.assign(updateState, {
          technicalid: curuserid,
          technicalstate: state,
          contractstate: state.substr(2, 1) === '1' ? '030' : state
        });
        break;
      case '03': // 合同评审
        Object.assign(updateState, {
          projectuserid: curuserid,
          projectstate: state,
          contractstate: state.substr(2, 1) === '1' ? '050' : state
        });
        break;
      case '05': // 法务评审
        Object.assign(updateState, {
          lawuserid: curuserid,
          lawstate: state,
          contractstate: state.substr(2, 1) === '1' ? '080' : state
        });
        break;
      case '08': // 数据接入
        Object.assign(updateState, {
          accessstate: state,
          contractstate: state.substr(2, 1) === '1' ? '090' : state
        });
        break;
      case '09': // 开票及打款
        Object.assign(updateState, {
          accountstate: state,
          contractstate:
            state.substr(2, 1) === '1'
              ? '092'
              : state.substr(2, 1) === '3'
                ? '94'
                : state
        });
        break;
      default:
    }
    const model = this.model('contract');
    const contractId = await model.where({ id: id }).update(updateState);
    return this.success({ id: contractId });
  }
  /**
   * store action 新增签单
   */
  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    const id = this.post('id');
    Object.assign(values, {
      createtime: parseInt(new Date().getTime() / 1000)
    });
    const model = this.model('contract');
    if (id > 0) {
      await model
        .where({ id: id, updatetime: parseInt(new Date().getTime() / 1000) })
        .update(values);
    } else {
      Object.assign(values, {
        contractstate: '010',
        createtime: parseInt(new Date().getTime() / 1000),
        userid: this.getLoginUserId()
      });
      delete values.id;
      const contractid = await model.add(values);
      if (
        contractid &&
        values.contractfiles &&
        values.contractfiles.length > 0
      ) {
        // 如果合同附件存在则插入合同附件
        const contractfiles = values.contractfiles;
        const filemodel = this.model('contract_attachment');
        contractfiles.map(file => {
          delete file.path;
          Object.assign(file, { contractid: contractid });
          return file;
        });
        const ids = await filemodel.addMany(contractfiles);
        // 更新合同附件字段
        await model.where({ id: contractid }).update({ attachment: ids });
      }
    }
    return this.success({ id: contractid });
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
    const transformer = this.post('transformer');
    const plan = this.post('plan');
    const planno = plan.substr(0, 2); // 提取方案代号
    // 返回字段
    const fields = [
      `industryratio`,
      `feefactor${planno}`,
      `ROUND( 1 / POWER( intr.totalpower / 800, intr.factor ), 2 )  AS capacityratio`,
      `ROUND(ROUND( 1 / POWER( intr.totalpower / 800, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)  AS feeratio`,
      `ROUND(intr.totalpower * intr.totalusehoursyear * intr.powerratio)  AS totalquantity`,
      `intr.feeunitprice`,
      `ROUND(intr.feeunitprice * ROUND(intr.totalpower * intr.totalusehoursyear * intr.powerratio)) AS totalfee`,
      `ROUND(ROUND(intr.feeunitprice * ROUND(intr.totalpower * intr.totalusehoursyear * intr.powerratio)) * ROUND(ROUND( 1 / POWER( intr.totalpower / 800, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)) AS fee`,
      `FLOOR(ROUND(ROUND(intr.feeunitprice * ROUND(intr.totalpower * intr.totalusehoursyear * intr.powerratio)) * ROUND(ROUND( 1 / POWER( intr.totalpower / 800, intr.factor ), 4 ) * intr.industryratio * intr.feefactor${planno}, 4)) / 1000)*1000 as recommendfee`
    ];
    const model = this.model('industry_transformer')
      .alias('intr')
      .join({
        table: 'transformer',
        join: 'left',
        as: 'tr',
        on: ['tr.transformerno', 'intr.transformer']
      });
    const data = await model
      .field(fields)
      .where(
        `intr.industry='${industry}' and tr.transformername >= ${transformer}`
      )
      .order(['tr.transformername ASC'])
      .limit(1)
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
        // res[`Q${data[i].Q}`] = data[i].amount;
        // res[`M${data[i].Q}`] = data[i].moneyisreceived;
        // data[i].amount
        //   ? (res[`MR${data[i].Q}`] = (
        //     (data[i].moneyisreceived * 100) /
        //       data[i].amount
        //   ).toFixed(2))
        //   : (res[`MR${data[i].Q}`] = '--');
        res['RT'] += data[i].amount;
        res['RM'] += data[i].contractvalue;
        res['RMR'] += data[i].recommendvalue;
        res['RN'] += data[i].recommendvalue / 30000;
        if (data[i].year === `${year}`) {
          // 汇总年度
          res['YT'] += data[i].amount;
          res['YM'] += data[i].contractvalue;
          res['YMR'] += data[i].recommendvalue;
          res['YN'] += data[i].recommendvalue / 30000;
          if (`${data[i].Q}` === `${quarter}`) {
            // 按季度统计
            res['QT'] += data[i].amount;
            res['QM'] += data[i].contractvalue;
            res['QMR'] += data[i].recommendvalue;
            res['QN'] += data[i].recommendvalue / 30000;
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
};
