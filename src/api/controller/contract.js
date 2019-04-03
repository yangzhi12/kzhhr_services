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
      console.log(values);
      await model
        .where({ id: id, updatetime: parseInt(new Date().getTime() / 1000) })
        .update(values);
    } else {
      console.log(values);
      Object.assign(values, {
        contractno: 'KZZH',
        contractstate: '010',
        userid: this.getLoginUserId()
      });
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }
};
