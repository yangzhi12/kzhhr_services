module.exports = class extends think.Model {
    /**
     * 获取图片列表
     * @param null
     * @returns {Promise.<*>}
     */
    async getUserAttachments(userid) {
        const attachmentList = await this.model('user_attachment')
            .where({ userid: ['=', userid] })
            .select();
        return attachmentList;
    }
    /**
     * 获取家庭成员关系
     * @param null
     * @returns {Promise.<*>}
     */
    async getUserFamily(userid) {
        const familyList = await this.model('user_family')
            .where({ userid: ['=', userid] })
            .select();
        return familyList;
    }
};
