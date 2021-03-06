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
        'con.recommendvalue',
        'con.contractstart',
        'con.contractend',
        'us.username',
        'con.contractstate',
        'con.paymenttime'
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
    const attachments = await model.getAttachments(id);
    Object.assign(data, { attachments: attachments });
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
    const curtime = parseInt(new Date().getTime());
    const updateState = Object.assign(
      {},
      {
        updatetime: curtime
      }
    );
    const model = this.model('contract');
    switch (state.substr(0, 2)) {
      case '01': // 技术评审
        Object.assign(updateState, {
          technicalid: curuserid,
          technicalstate: state,
          contractstate: state.substr(2, 1) === '1' ? '030' : state
        });
        break;
      case '03': // 合同评审
        if (state.substr(2, 1) === '1') {
          const no = await model.getContractno();
          Object.assign(updateState, {
            contractno: no
          });
        }
        Object.assign(updateState, {
          projectuserid: curuserid,
          projectstate: state,
          contractstate: state.substr(2, 1) === '1' ? '050' : state
        });
        break;
      case '05': // 数据接入
        Object.assign(updateState, {
          accessstate: state,
          contractstate: state.substr(2, 1) === '1' ? '070' : state
        });
        break;
      case '07': // 开票及打款
        Object.assign(updateState, {
          accountstate: state,
          contractstate:
            state.substr(2, 1) === '1'
              ? '072'
              : state.substr(2, 1) === '3'
                ? '080'
                : state,
          paymenttime: state.substr(2, 1) === '3' ? curtime : null
        });
        break;
      case '08': // 运营
        Object.assign(updateState, {
          accountstate: state,
          contractstate: state
        });
        break;
      default:
    }
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
      delete values.id;
      await model.add(values);
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
   * levelcontract action
   * @return {Promise} []
   */
  async levelcontractAction() {
    const userid = this.post('userid');
    const startdate = this.post('startdate');
    const enddate = this.post('enddate');
    const model = this.model('contract');
    const data = await model
      .field([
        'con.id',
        'con.contractno',
        'con.contractname',
        'con.contractvalue',
        'con.recommendvalue',
        'con.contractstart',
        'con.contractend',
        'con.contractstate',
        'con.paymenttime',
        'us.username'
      ])
      .alias('con')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'con.userid']
      })
      .where(
        `con.userid = ${userid} 
        and con.paymenttime > ${startdate} 
        and con.paymenttime < ${enddate}
        and con.accountstate = 073`
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
    const userid = this.post('userid');
    const model = this.model('contract');
    const users = await model.getRefuserList(userid);
    return this.success(users);
  }

  /**
   * levelcontracts action
   * @return {Promise} []
   */
  async levelcontractsAction() {
    var userids = [];
    const model = this.model('contract');
    const userid = this.post('userid');
    const users = await model.getRefuserList(userid);
    users.map(item => {
      userids.push(item.id);
    });
    const startdate = this.post('startdate');
    const enddate = this.post('enddate');
    const data = await model
      .field([
        'con.id',
        'con.contractno',
        'con.contractname',
        'con.contractvalue',
        'con.recommendvalue',
        'con.contractstart',
        'con.contractend',
        'con.contractstate',
        'con.paymenttime',
        'con.userid',
        'us.username'
      ])
      .alias('con')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'con.userid']
      })
      .where(
        `con.userid in (${userids})
        and con.paymenttime > ${startdate} 
        and con.paymenttime < ${enddate}
        and con.accountstate = 073`
      )
      .order(['con.id DESC'])
      .select();
    return this.success(data);
  }
  /**
   * allmember action
   * @return {Promise} []
   */
  async allmemberAction() {
    if (!this.isPost) return false;
    const members = await this.model('contract').getRefAllUserList();
    return this.success(members);
  }
};
