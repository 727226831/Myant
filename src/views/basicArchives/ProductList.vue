<template>
  <div>
    <a-card>
      <a-row :gutter="10">
        <a-col :span="4">
          <span>{{ titleTree }}</span>
          <a-button style="margin-left: 40px" type="primary" @click="classify">分类设置</a-button>
          <a-divider type="horizontal" />
          <a-input-search style="margin-bottom: 8px" placeholder="请输入关键字" @change="treeSearch" />
          <a-tree
            v-show="tree_visible"
            showLine
            :expanded-keys="expandedKeys"
            :auto-expand-parent="autoExpandParent"
            :tree-data="classifyTree"
            @expand="onExpand"
            @select="onSelect"
            :selectedKeys="checkedKeys"
          >
          </a-tree>
        </a-col>

        <a-col :span="20">
          <a-select default-value="全部" style="width: 220px" @change="selectChange">
            <a-select-option v-for="SList in selectList" :key="SList.key" :value="SList.key">{{
              SList.value
            }}</a-select-option>
          </a-select>

          <a-input-search @search="onSearch" style="width: 220px; margin-left: 20px" placeholder="请输入搜索内容" />

          <span class="table-page-search-submitButtons" :style="{ float: 'right', overflow: 'hidden' } || {}">
            <a-button type="primary" @click="add()">新增</a-button>
            <a-button style="margin-left: 5px" @click="downloadTemplate()">下载导入模板</a-button>
            <a-button style="margin-left: 5px" @click="importTemplate()">导入</a-button>
            <a-button style="margin-left: 5px" @click="() => (queryParam = {})">导出</a-button>
          </span>

          <a-table
            ref="table"
            size="default"
            :columns="columns"
            :data-source="listdata"
            :alert="false"
            :scroll="{ x: 1500, y: 525 }"
            bordered
            style="margin-top: 20px"
          >
            <span slot="action" v-show="Operat_visible" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />

              <a-popconfirm title="确定删除?" @confirm="() => deleteItem(record)">
                <a href="javascript:;">删除</a>
              </a-popconfirm>
            </span>
          </a-table>
        </a-col>
      </a-row>
    </a-card>
    <a-modal title="导入模板" @ok="importOk" v-model="importVisible">
      <a-upload
        name="file"
        :multiple="true"
        action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
        :headers="headers"
        :before-upload="beforeUpload"
        @change="handleChange"
      >
        <a-button> <a-icon type="upload" /> 选择 </a-button>
      </a-upload>
    </a-modal>
    <approval :visible="approval_visible" :product="product" @change="change"></approval>
  </div>
</template>

<script>
import XLSX from 'xlsx'
import moment from 'moment'
import Vue from 'vue'
import { Descriptions } from 'ant-design-vue'
import { Transfer } from 'ant-design-vue'
import { Comment } from 'ant-design-vue'
Vue.use(Descriptions)
Vue.use(Transfer)
Vue.use(Comment)
import { Tree } from 'ant-design-vue'
Vue.use(Tree)
import { Timeline } from 'ant-design-vue'
Vue.use(Timeline)
import { Mentions } from 'ant-design-vue'
Vue.use(Mentions)

import { STable } from '@/components'
import { getProductList, getProductListColumns, getclassificationGoodsList, getData, postData } from '@/api/manage'
import action from '../../core/directives/action'
import Approval from '../Approval'
import SelectModal from '../modal/SelectModal'
import { logininfo, menuname } from '@/store/mutation-types'
import { mapActions, mapGetters } from 'vuex'

const columns = []
const selectList = [{ value: '全部', key: 'all' }]

const Operat_visible = true
const dataList = []
export default {
  components: {
    STable,
    Approval,
    SelectModal,
  },

  data() {
    const oriTargetKeys = this.columns
    const targetList = []
    return {
       headers: {
        authorization: 'authorization-text',
      },
      expandedKeys: [],
      autoExpandParent: true,
      checkedKeys: [],

      selectList,
      Operat_visible,
      confirmLoading: false,
      columns,
      queryParam: {},
      selectedRowKeys: [],
      selectedKeys: [],
      listdata: [],
      classifyTree: [],
      moment,
      menuid: '',

      titleTree: '',
      urlTree: '',
      urlColumns: '',
      urlList: '',
      materialclassid: '',
      menuname: '',
      materialid: '',
      approval_visible: false,
      tree_visible: true,
      product: {},
      urlDelete: '',
      treeData: [],

      isSearch: false,
      searchValue: '',
      searchKey: 'all',
      isInit: false,

      importVisible: false,
      importData: undefined,
    }
  },
  mounted() {
    console.log('test--->', this.selectkey)

    this.initData(this.$route.name)
  },
  watch: {
    $route: {
      handler: function (val, oldVal) {
        this.initData(val.name)
      },
      // 深度观察监听
    },
  },
  computed: {
    ...mapGetters(['selectkey']),
  },
  methods: {
    handleChange(info) {
      console.log('info', info)
      if (info.file.status === 'uploading') {
        const params = {}
        params.memuid = this.menuid
        params.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
        params.data = this.importData
        console.log('params', JSON.stringify(params))

        postData(params, '/excel/importToMaterial').then((res) => {
          console.log('res-->', JSON.stringify(res))
          if (res.status == 'SUCCESS') {
           this.$message.info('导入成功')
           this.importVisible=false
          }
        })
        
      }
      if (info.file.status === 'done') {
        // Get this url from response in real world.
      }
    },
    beforeUpload(file) {
      const types = file.name.split('.')[1]
      const fileType = ['xlsx', 'xlc', 'xlm', 'xls', 'xlt'].some((item) => item === types)
      if (!fileType) {
        alert('格式错误！请重新选择')
        return
      }
      this.file2Xce(file).then((tabJson) => {
        console.log(tabJson)
        if (tabJson && tabJson.length > 0) {
          var data = {}
          var this_ = this

          this_.card = JSON.stringify(tabJson[0].sheet)
          data.card = this_.card
          this.importData = JSON.parse(data.card)
          console.log('card-->', JSON.stringify(this.importData))
        }
      })
    },
    file2Xce(file) {
      console.log('file-->', file)
      return new Promise(function (resolve, reject) {
        const reader = new FileReader()
        reader.onload = function (e) {
          const data = e.target.result
          this.wb = XLSX.read(data, {
            type: 'binary',
          })
          const result = []
          this.wb.SheetNames.forEach((sheetName) => {
            result.push({
              sheetName: sheetName,
              sheet: XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName]),
            })
          })
          resolve(result)
        }
        reader.readAsBinaryString(file)
      })
    },
    importOk(e) {
      console.log(e)
      this.importVisible = false
    },
    downloadTemplate() {
      const params = {}
      params.memuid = this.menuid
      params.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      console.log('params', JSON.stringify(params))

      getData(params, '/excel/exportExcel').then((res) => {
        console.log('res-->', JSON.stringify(res))
        if (res.status == 'SUCCESS') {
          let a = document.createElement('a')
          a.href = res.result
          a.click()
        }
      })
    },
    importTemplate() {
      this.importVisible = true
    },
    treeSearch(e) {
      const value = e.target.value
      this.classifyTree = this.treeData.filter((item) => JSON.stringify(item).includes(value))
    },
    delete() {
      const columnsParams = {}
      if (this.menuname == 'ProductList') {
        columnsParams.materialid = this.materialid
      } else if (this.menuname == 'PersonnelSetting') {
        columnsParams.personid = this.materialid
      } else if (this.menuname == 'SupplierList') {
        columnsParams.vendorid = this.materialid
      } else if (this.menuname == 'CustomerList') {
        columnsParams.customerid = this.materialid
      } else if (this.menuname == 'WarehouseList') {
        columnsParams.warehouseid = this.materialid
      }

      console.log('delete url--->', this.urlDelete)
      console.log('delete params--->', JSON.stringify(columnsParams))
      getData(columnsParams, this.urlDelete).then((res) => {
        console.log('delete res-->', JSON.stringify(res))
        this.$message.info(res.errorMsg)
        if (res.status == 'SUCCESS') {
          this.getList()
        }
      })
    },
    initData(name) {
      if (name == 'ProductList') {
        this.titleTree = '货品分类'
        this.urlTree = '/bd/product/materialClassTree'

        this.urlList = '/bd/product/productList'
        this.urlDelete = '/bd/product/delMaterialById'
      } else if (name == 'PersonnelSetting') {
        this.titleTree = '部门分类'
        this.urlTree = '/bd/Sector'

        this.urlList = '/bd/baseperson/PersonnelSettingList'
        this.urlDelete = '/bd/baseperson/deletePerson'
      } else if (name == 'SupplierList') {
        this.titleTree = '供应商分类'
        this.urlTree = '/bd/basevendor/vendorTree'
        this.urlColumns = '/bd/basevendor/vendorColumns'
        this.urlList = '/bd/basevendor/vendorlist'
        this.urlDelete = '/bd/basevendor/delvendorbyid'
      } else if (name == 'CustomerList') {
        this.titleTree = '客户分类'
        this.urlTree = '/bd/customer/CustomerTree'

        this.urlList = '/bd/customer/customerlist'
        this.urlDelete = '/bd/customer/delCustomerbyid'
      } else if (name == 'WarehouseList') {
        this.titleTree = '仓位分类'
        this.urlTree = '/bd/warehouse/WarehouseTree'

        this.urlList = '/bd/warehouse/warehouselist'
        this.urlDelete = '/bd/warehouse/delWarehousebyid'
      } else {
        return
      }

      if (this.menuname == name) {
        this.isInit = false
      } else {
        this.isInit = true
      }
      this.menuname = name

      this.urlColumns = '/sys/setting/getSetting'
      const parameter = {}
      parameter.memucode = this.$route.meta.permission[0]

      var url = '/bd/menu/findallmenu'

      console.log('gtmenuid res-->', JSON.stringify(parameter))
      getData(parameter, url).then((res) => {
        console.log('menu id-->', JSON.stringify(res))

        this.menuid = res.result
        this.getTree()
        this.getList()
        this.getColumns()
      })
    },
    getColumns() {
      const columnsParams = {}
      columnsParams.menuid = this.menuid
      columnsParams.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      console.log('columnsurl--->', this.urlColumns)
      console.log('columns parameter-->', JSON.stringify(columnsParams))
      getProductListColumns(columnsParams, this.urlColumns).then((res) => {
        this.columns = res.result.columns

        for (let i = 0; i < this.columns.length - 1; i++) {
          this.selectList.push({ value: this.columns[i].title, key: this.columns[i].dataIndex })
        }
      })
    },
    getTree() {
      this.checkedKeys = []
      const parameter = {}
      this.classifyTree = []
      parameter.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      getclassificationGoodsList(parameter, this.urlTree).then((res) => {
        if (this.isInit) {
          var treekey = res.result[0].key
          this.$store.commit('SET_SELECTKEY', treekey)
        } else {
          var treekey = this.selectkey
        }

        this.checkedKeys.push(treekey)
        this.materialclassid = treekey
        this.treeData = res.result
        this.classifyTree = this.treeData

        this.expandedKeys.push(treekey)

        this.getList()
      })
    },
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys
      this.autoExpandParent = false
    },

    onSelect(selectedKeys, info) {
      this.checkedKeys = []
      this.checkedKeys.push(selectedKeys[0])
      console.log('onselect-->', selectedKeys)
      this.materialclassid = selectedKeys.join()
      this.getList()
      this.$store.commit('SET_SELECTKEY', this.materialclassid)
    },
    getList() {
      const parameter = {}
      if (this.menuname == 'PersonnelSetting') {
        parameter.departmentid = this.materialclassid
      } else if (this.menuname == 'ProductList') {
        parameter.materialclassid = this.materialclassid
      } else if (this.menuname == 'SupplierList') {
        parameter.vendorclassid = this.materialclassid
      } else if (this.menuname == 'CustomerList') {
        parameter.customerclassid = this.materialclassid
      } else if (this.menuname == 'WarehouseList') {
        parameter.warehouseclassid = this.materialclassid
      }

      parameter.enterpriseid = Vue.ls.get(logininfo).basepersonPO.enterpriseid
      parameter.pageNo = '1'
      parameter.pageSize = '10'
      if (this.isSearch) {
        console.log('search-->', this.searchKey + '/' + this.searchValue)
        parameter[`${this.searchKey}`] = this.searchValue
      }

      console.log('list url-->', this.urlList)
      console.log('list params-->', JSON.stringify(parameter))
      getProductList(parameter, this.urlList).then((res) => {
        this.listdata = res.result.data

        for (const key in this.listdata) {
          this.listdata[key].key = key
        }
        this.isSearch = false
      })
    },
    onSearch(value) {
      this.isSearch = true
      this.searchValue = value
      this.getList()
    },
    selectChange(value) {
      this.searchKey = value
    },

    classify(e) {
      var pushPath = ''
      if (this.menuname == 'ProductList') {
        pushPath = 'ProductType'
      } else if (this.menuname == 'PersonnelSetting') {
        pushPath = 'PersonsettingType'
      } else if (this.menuname == 'SupplierList') {
        pushPath = 'SupplierType'
      } else if (this.menuname == 'CustomerList') {
        pushPath = 'CustomerType'
      } else if (this.menuname == 'WarehouseList') {
        pushPath = 'WarehouseType'
      }
      this.$router.push({
        path: pushPath,
        query: {
          menu: this.$route.name,
          baseTitle: this.$route.meta.title,
        },
      })
    },
    add() {
      var pushPath = ''
      if (this.menuname == 'ProductList') {
        pushPath = 'PersonsettingAdd'
      } else if (this.menuname == 'PersonnelSetting') {
        pushPath = 'ProductAdd'
      } else if (this.menuname == 'SupplierList') {
        pushPath = 'SupplierAdd'
      } else if (this.menuname == 'CustomerList') {
        pushPath = 'CustomerAdd'
      } else if (this.menuname == 'WarehouseList') {
        pushPath = 'WarehouseAdd'
      }
      console.log(pushPath + '--->')
      this.$router.push({
        path: pushPath,
        query: {
          menu: this.$route.name,
          menuid: this.menuid,
          materialclassid: this.materialclassid,
          tag: 1,
          baseTitle: this.$route.meta.title,
        },
      })
    },

    handleEdit(record) {
      var pushPath = ''
      if (this.menuname == 'ProductList') {
        this.materialid = record.materialid
        pushPath = 'PersonsettingEdit'
      } else if (this.menuname == 'PersonnelSetting') {
        this.materialid = record.personid
        pushPath = 'ProductEdit'
      } else if (this.menuname == 'SupplierList') {
        this.materialid = record.vendorid
        pushPath = 'SupplierEdit'
      } else if (this.menuname == 'CustomerList') {
        this.materialid = record.customerid
        pushPath = ''
      } else if (this.menuname == 'WarehouseList') {
        this.materialid = record.warehouseid
        pushPath = ''
      }

      this.$router.push({
        path: pushPath,
        query: {
          menu: this.$route.name,
          materialid: this.materialid,
          tag: 2,
          menuid: this.menuid,
          baseTitle: this.$route.meta.title,
        },
      })
    },
    deleteItem(record) {
      if (this.menuname == 'ProductList') {
        this.materialid = record.materialid
      } else if (this.menuname == 'PersonnelSetting') {
        this.materialid = record.personid
      } else if (this.menuname == 'SupplierList') {
        this.materialid = record.vendorid
      } else if (this.menuname == 'CustomerList') {
        this.materialid = record.customerid
      } else if (this.menuname == 'WarehouseList') {
        this.materialid = record.warehouseid
      }
      this.delete()
    },
    handleSub(record) {
      console.log(record)
    },

    change(visible) {
      this.approval_visible = visible
    },
    handleAdd(item) {
      console.log('add button, item', item)
      //   this.$message.info(`提示：你点了 ${item.key} - ${item.title} `)
      this.$refs.modal.add(item.key)
    },
    handleTitleClick(item) {
      console.log('handleTitleClick', item)
    },
  },
}
</script>
<style lang="less" scoped>
</style>
