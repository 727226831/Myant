<template>
  <a-layout>
    <a-spin size="large" :spinning="spinning" tip="正在加载">
      <div>
        <a-card>
          <a-form
            class="ant-advanced-search-form"
            :form="form"
            :label-col="{ span: 3 }"
            :wrapper-col="{ span: 20 }"
            @submit="handleSubmit"
          >
            <a-form-item v-for="item in data" :label="item.title">
              <div v-if="item.selectVisible">
                <a-cascader
                  v-decorator="item.decorator"
                  v-show="item.selectVisible"
                  :field-names="{ label: 'title', value: 'key', children: 'children' }"
                  :options="item.selectList"
                  placeholder="请选择"
                  :disabled="item.disabled"
                />
              </div>
              <div v-else>
                <a-input
                  v-decorator="item.decorator"
                  :disabled="item.disabled"
                  v-show="item.inputVisible"
                  :maxLength="item.fieldlength"
                />
                <a-input-number
                  :style="{ width: '1370px' }"
                  v-decorator="item.decorator"
                  v-show="item.inputnumberVisible"
                  :max="item.fieldmax"
                  :precision="item.fieldprecision"
                  :disabled="item.disabled"
                />
                <a-date-picker
                  :style="{ width: '100%' }"
                  v-show="item.timepickerVisible"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择日期"
                  v-decorator="item.decorator"
                  :disabled="item.disabled"
                />
                <a-input
                  v-decorator="item.decorator"
                  v-show="item.listVisible"
                  :maxLength="item.fieldlength"
                  :disabled="disabled"
                >
                  <a-button slot="suffix" type="link" @click="() => showModal(item)">选择</a-button>
                </a-input>
              </div>
            </a-form-item>
            <a-form-item :wrapper-col="{ span: 21, offset: 2 }">
              <a-tabs>
                <a-tab-pane tab="明细">
                  <a-dropdown>
                    <a class="ant-dropdown-link" @click="(e) => e.preventDefault()" style="margin-left: 20px">
                      选择 <a-icon type="down" />
                    </a>
                    <a-menu slot="overlay" @click="onClick">
                      <a-menu-item key="1"> 选择料品 </a-menu-item>
                      <a-menu-item key="2" v-if="menu == 'StorageManagementList'">参照收货通知单 </a-menu-item>
                    </a-menu>
                  </a-dropdown>

                  <a-table :columns="columns" :data-source="detailsData" :scroll="{ x: 3000 }">
                    <template v-for="col in columns" :slot="col.dataIndex" slot-scope="text, record, index">
                      <div>
                        <a-input
                          :value="text"
                          @change="(e) => handleChange(e.target.value, col.dataIndex, record)"
                          v-if="col.isEdit"
                        />
                        <template v-else>
                          {{ text }}
                        </template>
                      </div>
                    </template>
                    <span slot="doclinequantity" slot-scope="text, record">
                      <a-input
                        :value="text"
                        @pressEnter="(e) => waitquantityChange(e.target.value, record)"
                        type="number"
                      />
                    </span>

                    <span slot="action" slot-scope="text, record">
                      <a @click="handleEdit(record)">编辑</a>
                      <a-divider type="vertical" />

                      <a-popconfirm title="确定删除?" @confirm="() => deleteItem(record)">
                        <a href="javascript:;">删除</a>
                      </a-popconfirm>
                    </span>
                  </a-table>
                </a-tab-pane>
              </a-tabs>
            </a-form-item>
          </a-form>

          <a-modal
            title="选择"
            :visible="visible"
            @ok="archivesOk"
            @cancel="handleCancel"
            width="1300px"
            :destroyOnClose="destroyOnClose"
          >
            <archives-modal :name="name" @onSelect="getSelect"></archives-modal>
          </a-modal>
          <a-modal
            title="选择"
            :visible="typeVisible"
            @ok="handleOk"
            @cancel="handleCancel"
            width="1300px"
            :destroyOnClose="destroyOnClose"
          >
            <type :menuname="name" @onSelect="typeSelect"></type>
          </a-modal>
          <a-modal
            title="选择"
            :visible="detailVisible"
            @ok="detailOk"
            @cancel="detailCancel"
            :destroyOnClose="destroyOnClose"
            width="1300px"
          >
            <select-modal :modalname="name" :visible="visible" @onSelect="detailSelect"></select-modal>
          </a-modal>
        </a-card>
      </div>
    </a-spin>
    <a-layout-footer
      :style="{ position: 'fixed', width: '100%', height: '70px', bottom: '0px', marginLeft: '-10px', zIndex: '999' }"
    >
      <a-card>
        <a-row type="flex" justify="center" align="top">
          <a-col :span="12">
            <a-button type="primary" style="margin-right: 10px" v-show="approvalVisilbe" @click="approval"
              >提交审批</a-button
            >
            <a-button type="primary" style="margin-right: 10px" v-show="cancelVisilbe" @click="cancelClick"
              >撤回审批</a-button
            >
            <a-button type="primary" ref="submit" style="margin-right: 10px" v-show="saveVisible" @click="handleSubmit"
              >保存继续</a-button
            >
            <a-button type @click="Back" style="margin-right: 10px" v-show="saveVisible">保存返回</a-button>
            <a-modal title="提示" :visible="submitVisible" @ok="approvalOk" @cancel="approvalCancel">
              <p>{{ approvaltext }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </a-card>
    </a-layout-footer>
  </a-layout>
</template>

<script>
import Vue from 'vue'
import { formModel, Button, Tree } from 'ant-design-vue'
import { Cascader } from 'ant-design-vue'
Vue.use(Cascader)
import { PageHeader } from 'ant-design-vue'
Vue.use(PageHeader)
Vue.use(formModel, Button)
import { postProductAdd } from '@/api/manage'
import { logininfo, menuname } from '@/store/mutation-types'
import { getForm, submitForm, postData, getData } from '@/api/manage'
import { Form } from 'ant-design-vue'
Vue.use(Form)
import { TreeSelect } from 'ant-design-vue'
import { keys, type } from 'mockjs2'
Vue.use(TreeSelect)
import ArchivesModal from '../modal/ArchivesModal'
import Type from '../modal/TypeModal'
import SelectModal from '../modal/SelectModal'
import { getProductListColumns } from '@/api/manage'
import { Empty } from 'ant-design-vue'
import { isRendered } from 'nprogress'
Vue.use(Empty)

const numberRow = []
export default {
  components: {
    Type,
    ArchivesModal,
    SelectModal,
  },
  data() {
    return {
      disabled: true,
      numberRow,
      selectedRow: [],
      selectedRowKeys: [],
      size: 'small',
      labelCol: { span: 2 },
      wrapperCol: { span: 22 },
      other: '',
      data: [],
      menuid: '',
      urlForm: '',
      materialclassid: '',
      materialid: '',
      tag: 0, //1 add 2update
      title: '',
      visible: false,
      modalname: '',
      selectList: [],
      typeVisible: false,
      currentkey: '',
      detailVisible: false,
      columns: [],
      detailsData: [],
      menuid: '',
      departmentid: '',
      personid: '',
      vendorid: '',
      warehouseid: '',
      businessclassid: '',
      spinning: false,
      name: '',
      approvalVisilbe: false,
      approveStatus: 8,
      destroyOnClose: true,
      menu: '',
      status: 1, //1保存继续2保存返回
      stockincode: '',
      billcode: '',
      currentRecord: '',
      saveVisible: true,
      cancelVisilbe: false,
      continueVisible: true,
      approvalprocess: '', //1启用 2未启用
      submitVisible: false,
      approvaltext: '是否提交审批?',
      businessname: '',
    }
  },
  created() {
    this.initdata()
  },
  activated() {
    console.log('activated', 'is run')
    this.initdata()
  },
  beforeCreate() {
    this.form = this.$form.createForm(this, { formname: 'form' })
  },
  methods: {
    approvalOk(e) {
      this.submitApproval()
      this.submitVisible = false
      this.addinit()
    },
    addinit() {
      if (this.status == 1) {
        this.getFormdata()
      } else if (this.status == 2) {
        this.$multiTab.closeCurrentPage()
      }
    },
    approvalCancel(e) {
      this.submitVisible = false
      this.addinit()
    },

    onClick({ key }) {
      console.log(`Click on item ${key}`)
      if (key == '1') {
        this.detailModal()
      } else {
        this.currentkey = 'list'
        this.name = 'ReceiptNoticeList'
        this.visible = true
      }
    },
    cancelClick(e) {
      const parameter = {}
      parameter.memuid = this.menuid
      parameter.bizid = this.materialid
      var url = ''
      if (this.approvalprocess == 1) {
        url = '/work/recallProcess'
      } else {
        url = '/work/directApproval'
      }
      console.log('cancel-->', JSON.stringify(parameter))
      getData(parameter, url).then((res) => {
        if (res.status == 'SUCCESS') {
          this.$message.info('撤销成功')
          this.getFormdata()
        } else {
          this.$message.warn(res.errorMsg)
        }
      })
    },
    handleEdit(record) {
      console.log(JSON.stringify(record.doclineid))
      if (record.docid) {
        this.$message.info('参照明细不能修改')
      } else {
        this.name = 'ProductList'
        this.currentkey = 'edit'
        this.visible = true

        this.currentRecord = record
      }
    },
    submit() {
      this.form.validateFields((err, values) => {
        if (!err) {
          if (this.$route.query.tag == 1) {
            if (this.$route.query.menu == 'ReceiptNoticeList') {
              var submitUrl = '/bd/docreceiptnotice/instersave'
            } else if (this.$route.query.menu == 'StorageManagementList') {
              var submitUrl = '/bd/Stockinrecord/insterSave'
            }
          } else {
            if (this.$route.query.menu == 'ReceiptNoticeList') {
              var submitUrl = '/bd/docreceiptnotice/updatesave'
            } else if (this.$route.query.menu == 'StorageManagementList') {
              var submitUrl = '/bd/Stockinrecord/updateSave'
            }
            values.docid = this.materialid
          }
          if (this.detailsData.length == 0) {
            this.$message.warn('请添加明细')
            return
          }
          values.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
          values.details = this.detailsData
          values.departmentid = this.departmentid
          values.personid = this.personid
          values.vendorid = this.vendorid
          values.businessclasscode = this.businessclassid
          values.warehouseid = this.warehouseid
          values.approvalprocess = values.approvalprocess.join()
          console.log('submit url-->', submitUrl)
          console.log('submit parameter-->', JSON.stringify(values))
          submitForm(values, submitUrl)
            .then((res) => {
              console.log('submit--->', JSON.stringify(res))
              if (res.status == 'SUCCESS') {
                this.detailsData = []
                if (this.$route.query.tag == 2) {
                  //编辑
                  if (this.status == 1) {
                    this.getList(this.$route.query.menu, this.$route.query.materialid, 0)
                  } else {
                    this.$multiTab.closeCurrentPage()
                  }
                } else {
                  this.submitVisible = true
                  this.materialid = res.result.bizid
                  this.billcode = res.result.billcode
                  this.approvalprocess = values.approvalprocess
                }
              }
              this.$message.info(res.errorMsg)
            })
            .catch((err) => {
              this.$message.error(err.message)
            })
        }
      })
    },
    waitquantityChange(value, record) {
      if (this.$route.query.menu == 'StorageManagementList') {
        if (parseInt(record.doclinequantity) > parseInt(value)) {
          var temp = JSON.parse(JSON.stringify(record))
          temp.doclinequantity = parseInt(record.doclinequantity) - parseInt(value)
          this.detailsData.push(temp)
        }
      }
      record.doclinequantity = value
      this.detailsData = this.detailsData.map((item, index) => {
        return { ...item, doclineno: index + 1 }
      })
    },
    handleChange(value, key, record) {
      record[key] = value
    },
    submitApproval() {
      //提交审批
      const parameter = {}
      parameter.bizid = this.materialid
      parameter.memuid = this.menuid
      var url = ''
      if (this.approvalprocess == 1) {
        url = '/work/submitProcess'
        parameter.billcode = this.billcode
        parameter.businessname = this.businessname
      } else {
        url = '/work/directApproval'
      }
      console.log('approval-->', JSON.stringify(parameter))
      console.log('approval url-->', url)
      getData(parameter, url).then((res) => {
        if (res.status == 'SUCCESS') {
          this.$message.info('提交审批成功')
        } else {
          this.$message.info(res.errorMsg)
        }
      })
    },
    approval(e) {
      this.submitApproval()
    },
    deleteItem(record) {
      this.detailsData = this.detailsData.filter((item) => item.doclineno !== record.doclineno)
    },
    initdata() {
      this.spinning = true
      this.menu = this.$route.query.menu
      console.log('add menu-->', this.$route)
      if (this.$route.query.menu == 'ReceiptNoticeList') {
        this.memuid = '03bf0fb1-e9fb-4014-92e7-7121f4f72003'
      } else if (this.$route.query.menu == 'StorageManagementList') {
        this.memuid = '03bf0fb1-e9fb-4014-92e7-7121f4f72002'
      } else {
        return
      }
      this.materialid = this.$route.query.materialid
      console.log('route-->', this.$route)
      if (this.$route.query.tag == 2) {
        this.getList(this.$route.query.menu, this.$route.query.materialid, 0)
      } else {
        this.detailsData = []
      }
      this.getFormdata()
      this.getColumns()
    },
    getColumns() {
      const columnsParams = {}
      columnsParams.menuid = this.menuid
      columnsParams.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      var urlColumns = '/sys/setting/getChildrenSetting'
      console.log('columns url--->', urlColumns)
      console.log('columns parameter-->', JSON.stringify(columnsParams))
      this.scopeList = []
      getProductListColumns(columnsParams, urlColumns).then((res) => {
        this.columns = res.result.columns
      })
    },
    getList(menu, id, type) {
      const columnsParams = {}
      columnsParams.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      columnsParams.pageNo = 1
      columnsParams.pageSize = 10
      columnsParams.docid = id
      if (menu == 'ReceiptNoticeList') {
        var urlColumns = '/bd/docreceiptnotice/childrenlist'
      } else if (menu == 'StorageManagementList') {
        var urlColumns = '/bd/Stockinrecord/stockinrecordlineList'
      }
      console.log('listdata url--->', urlColumns)
      console.log('listdata parameter-->', JSON.stringify(columnsParams))
      getData(columnsParams, urlColumns).then((res) => {
        console.log('list--->', JSON.stringify(res.result.data[0]))
        if (type == 0) {
          //编辑明细
          this.detailsData = []
          this.detailsData = res.result.data
        } else {
          //参照明细
          var addData = []
          addData = res.result.data
          addData = addData.map((item, index) => {
            return { ...item, doclinequantity: item.doclinenotputquantity, receiptnoticelineid: item.doclineid }
          })
          this.detailsData = this.detailsData.concat(addData)
        }
        this.detailsData = this.detailsData.map((item, index) => {
          return { ...item, doclineno: index + 1 }
        })
      })
    },
    detailSelect(list) {
      this.selectList = list
    },
    getSelect(list) {
      this.selectList = list
    },
    typeSelect(list) {
      console.log('type-->', JSON.stringify(list))
      this.selectList = list
    },
    detailModal(e) {
      this.selectedRowKeys = []
      for (const key in this.detailsData) {
        this.selectedRowKeys.push(this.detailsData[key].materialid)
      }
      this.detailVisible = true
      this.name = 'ProductList'
    },
    detailOk(e) {
      this.detailVisible = false
      this.detailsData = this.detailsData.concat(this.selectList)
      this.detailsData = this.detailsData.map((item, index) => {
        return { ...item, doclineno: parseInt(index) + 1 }
      })
    },
    detailCancel(e) {
      this.detailVisible = false
    },
    handleOk(e) {
      this.setform()
    },
    archivesOk(e) {
      this.setform()
    },
    setform() {
      console.log('current--->', JSON.stringify(this.currentkey))
      if (this.currentkey == 'departmentid') {
        this.typeVisible = false
        this.form.setFieldsValue({
          departmentid: this.selectList.title,
        })
        this.form.setFieldsValue({
          personid: '',
        })
        this.personid = ''
        this.departmentid = this.selectList.departmentid
      } else if (this.currentkey == 'personid') {
        this.visible = false
        this.form.setFieldsValue({
          personid: this.selectList[0].personname,
        })
        this.personid = this.selectList[0].personid
        this.form.setFieldsValue({
          departmentid: this.selectList[0].departmentname,
        })
        this.departmentid = this.selectList[0].departmentid
      } else if (this.currentkey == 'warehouseid') {
        this.visible = false
        this.form.setFieldsValue({
          warehouseid: this.selectList[0].warehousename,
        })
        this.warehouseid = this.selectList[0].warehouseid
      } else if (this.currentkey == 'vendorid') {
        this.visible = false
        this.form.setFieldsValue({
          [this.currentkey]: this.selectList[0].vendorcode,
        })
        this.form.setFieldsValue({
          vendorcontactenterprise: this.selectList[0].vendorname,
        })
        this.form.setFieldsValue({
          vendorcontactaddress: this.selectList[0].vendoraddress,
        })
        this.form.setFieldsValue({
          vendorcontacthead: this.selectList[0].vendorhead,
        })
        this.form.setFieldsValue({
          vendorcontactphone: this.selectList[0].vendortel,
        })

        this.vendorid = this.selectList[0].vendorid
      } else if (this.currentkey == 'businessclasscode') {
        this.typeVisible = false
        this.form.setFieldsValue({
          businessclasscode: this.selectList.businessclasscode,
        })

        this.form.setFieldsValue({
          businessclassname: this.selectList.title,
        })
        this.businessclassid = this.selectList.key
      } else if (this.currentkey == 'receiptnoticecode') {
        //收货通知选择
        this.visible = false
        var formdata = this.form.domFields
        var formkey = Object.keys(formdata)
        for (const key in formkey) {
          this.form.setFieldsValue({
            [formkey[key]]: this.selectList[0][formkey[key]],
          })
        }
        this.form.setFieldsValue({
          vendorid: this.selectList[0].vendorcode,
        })
        this.form.setFieldsValue({
          receiptnoticecode: this.selectList[0].doccode,
        })
        this.form.setFieldsValue({
          doccode: this.billcode,
        })
        this.form.setFieldsValue({
          receiptnoticeid: this.selectList[0].docid,
        })

        this.form.setFieldsValue({
          personid: this.selectList[0].personname,
        })
        this.form.setFieldsValue({
          departmentid: this.selectList[0].departmentname,
        })
        if (this.selectList[0].approvalprocess == '启用') {
          this.form.setFieldsValue({
            approvalprocess: ['1'],
          })
        } else {
          this.form.setFieldsValue({
            approvalprocess: ['2'],
          })
        }

        this.personid = this.selectList[0].personid
        this.departmentid = this.selectList[0].departmentid
        this.businessclassid = this.selectList[0].businessclassid
        this.vendorid = this.selectList[0].vendorid
        this.getList('ReceiptNoticeList', this.selectList[0].docid, 1)
      } else if (this.currentkey == 'edit') {
        this.visible = false
        var formkey = Object.keys(this.currentRecord)
        for (const key in formkey) {
          if (this.selectList[0][formkey[key]]) {
            if (formkey[key] !== 'key') {
              this.currentRecord[formkey[key]] = this.selectList[0][formkey[key]]
            }
          }
        }
      } else if (this.currentkey == 'list') {
        this.getList('ReceiptNoticeList', this.selectList[0].docid, 1)
        this.visible = false
      }
    },
    handleCancel(e) {
      if (this.currentkey == 'departmentid') {
        this.typeVisible = false
      } else if (this.currentkey == 'personid') {
        this.visible = false
      } else if (this.currentkey == 'vendorid') {
        this.visible = false
      } else if (this.currentkey == 'businessclasscode') {
        this.typeVisible = false
      } else if (this.currentkey == 'receiptnoticecode') {
        this.visible = false
      } else if (this.currentkey == 'edit') {
        this.visible = false
      } else if (this.currentkey == 'list') {
        this.visible = false
      }
    },

    showModal(item) {
      this.currentkey = item.key
      if (this.currentkey == 'departmentid') {
        this.typeVisible = true
        this.name = 'PersonnelSetting'
      } else if (this.currentkey == 'personid') {
        this.name = 'PersonnelSetting'
        this.visible = true
      } else if (this.currentkey == 'vendorid') {
        this.name = 'SupplierList'
        this.visible = true
      } else if (this.currentkey == 'businessclasscode') {
        this.typeVisible = true
        this.name = 'BusinessCategory'
      } else if (this.currentkey == 'receiptnoticecode') {
        this.name = 'ReceiptNoticeList'
        this.visible = true
      } else if (this.currentkey == 'warehouseid') {
        this.name = 'WarehouseList'
        this.visible = true
      }
    },
    handleSubmit(e) {
      this.status = 1
      this.submit()
    },
    getFormdata() {
      this.modalname = this.$route.query.menu
      this.menuid = this.$route.query.menuid
      const columnsParams = {}
      columnsParams.memuid = this.menuid
      columnsParams.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid

      if (this.$route.query.tag == 1) {
        this.approvalVisilbe = false
        this.continueVisible = true
        this.saveVisible = true
        this.title = this.$route.query.storageTitle + '新增'
        this.materialclassid = this.$route.query.materialclassid
        if (this.$route.query.menu == 'ReceiptNoticeList') {
          this.urlForm = '/bd/docreceiptnotice/insterform'
        } else if (this.$route.query.menu == 'StorageManagementList') {
          this.urlForm = '/bd/Stockinrecord/insterForm'
        }
      } else if (this.$route.query.tag == 2) {
        this.approvalVisilbe = true
        this.title = this.$route.query.storageTitle + '编辑'

        if (this.$route.query.menu == 'ReceiptNoticeList') {
          this.urlForm = '/bd/docreceiptnotice/updateform'
        } else if (this.$route.query.menu == 'StorageManagementList') {
          this.urlForm = '/bd/Stockinrecord/updateForm'
        }
        columnsParams.docid = this.materialid
      }
      this.$multiTab.rename(this.$route.path, this.title)
      console.log('form url--->', this.urlForm)
      console.log('form params-->', JSON.stringify(columnsParams))
      this.data = []
      getForm(columnsParams, this.urlForm).then((res) => {
        console.log('form--->', JSON.stringify(res))
        if (res.status == 'SUCCESS') {
          this.data = res.result
        } else {
          this.$message.info(res)
        }

        setTimeout(() => {
          for (const i in this.data) {
            this.form.setFieldsValue({
              [this.data[i].key]: this.data[i].value,
            })
            if (this.data[i].key == 'departmentid') {
              this.departmentid = this.data[i].keyvalue
            } else if (this.data[i].key == 'personid') {
              this.personid = this.data[i].keyvalue
            } else if (this.data[i].key == 'vendorid') {
              this.vendorid = this.data[i].keyvalue
            } else if (this.data[i].key == 'doccode') {
              this.billcode = this.data[i].value
            } else if (this.data[i].key == 'businessclassname') {
              this.businessname = this.data[i].value
            } else if (this.data[i].key == 'ApproveStatus') {
              if (this.$route.query.tag == 2) {
                this.continueVisible = false
                if (this.data[i].value == 3) {
                  this.cancelVisilbe = true
                  this.approvalVisilbe = false
                  this.saveVisible = false
                } else if (this.data[i].value == 8) {
                  this.cancelVisilbe = false
                  this.approvalVisilbe = true
                  this.saveVisible = true
                } else {
                  this.cancelVisilbe = false
                  this.approvalVisilbe = false
                  this.saveVisible = false
                }
              }
            } else if (this.data[i].key == 'approvalprocess') {
              this.approvalprocess = this.data[i].value.join()
            }
          }
          this.spinning = false
        }, 500)
      })
    },
    // 返回到清单页面
    Back(e) {
      this.status = 2
      this.submit()
      // 路由跳转
    },
  },
}
</script>
<style lang="less">
</style>