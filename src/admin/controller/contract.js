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
    const updateState = Object.assign(
      {},
      {
        updatetime: parseInt(new Date().getTime() / 1000)
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
          contractstate: state.substr(2, 1) === '1' ? '080' : state
        });
        break;
      // case '05': // 法务评审
      //   // 合同生效后(法务评审通过)生成合同编号
      //   if (state.substr(2, 1) === '1') {
      //     const no = await model.getContractno();
      //     Object.assign(updateState, {
      //       contractno: no
      //     });
      //   }
      //   Object.assign(updateState, {
      //     lawuserid: curuserid,
      //     lawstate: state,
      //     contractstate: state.substr(2, 1) === '1' ? '080' : state
      //   });
      //   break;
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
};
