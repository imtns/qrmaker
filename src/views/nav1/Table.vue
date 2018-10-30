<template>
    <section>
        <!--工具条-->
        <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
            <el-form :inline="true" :model="filters">
                <el-form-item>
                    <el-input v-model="filters.id" placeholder="ID"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" v-on:click="getList">查询</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleAdd">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>

        <!--列表-->
        <el-table :data="list" highlight-current-row v-loading="listLoading" @selection-change="selsChange" style="width: 100%;">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="id" label="ID" width="80" sortable>
            </el-table-column>
            <el-table-column prop="project_name" label="项目名称" width="240" sortable>
            </el-table-column>
            <el-table-column prop="git_url" label="git地址" width="440" sortable>
            </el-table-column>
            <el-table-column prop="isWepy" label="是否wepy" width="120" sortable>
            </el-table-column>
            <!-- <el-table-column prop="git_username" label="用户名" width="120" sortable>
            </el-table-column>
            <el-table-column prop="git_password" label="密码" width="120" sortable>
            </el-table-column> -->
            <el-table-column prop="create_time" label="创建时间" width="180" sortable>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="270">
                <template scope="scope">
                    <el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                    <el-button size="small" @click="makeQR(scope.$index, scope.row)">生成二维码</el-button>
                    <el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!--工具条-->
        <el-col :span="24" class="toolbar">
            <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
            <el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="10" :total="total" style="float:right;">
            </el-pagination>
        </el-col>

        <!--编辑界面-->
        <el-dialog title="编辑" v-model="editFormVisible" :close-on-click-modal="false">
            <el-form :model="editForm" label-width="80px" :rules="FormRules" ref="editForm">
                <el-form-item label="项目名" prop="project_name">
                    <el-input v-model="editForm.project_name" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="是否wepy">
                    <el-radio-group v-model="editForm.codetype">
                        <el-radio class="radio" :label="0">否</el-radio>
                        <el-radio class="radio" :label="1">是</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="git地址" prop="git_url">
                    <el-input v-model="editForm.git_url" auto-complete="off"></el-input>
                </el-form-item>
                <!-- <el-form-item label="用户名" prop="git_username">
					<el-input  v-model="editForm.git_username" auto-complete="off" ></el-input>
				</el-form-item>
				<el-form-item label="用户密码" prop="git_password">
                    <el-input  v-model="editForm.git_password" auto-complete="off" type="password"></el-input>
				</el-form-item> -->
                <el-form-item label="文件夹名" v-show="editForm.codetype==0">
                    <el-input v-model="editForm.folder" auto-complete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="editFormVisible = false">取消</el-button>
                <el-button type="primary" @click.native="editSubmit" :loading="editLoading">提交</el-button>
            </div>
        </el-dialog>

        <!--新增界面-->
        <el-dialog title="新增" v-loading="qrLoading" element-loading-text="拼命加载中" v-model="addFormVisible" :close-on-click-modal="false">
            <el-form :model="addForm" label-width="80px" :rules="FormRules" ref="addForm">
                <el-form-item label="项目名" prop="project_name">
                    <el-input v-model="addForm.project_name" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="是否wepy">
                    <el-radio-group v-model="addForm.codetype">
                        <el-radio class="radio" label="0">否</el-radio>
                        <el-radio class="radio" label="1">是</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="git地址" prop="git_url">
                    <el-input v-model="addForm.git_url" auto-complete="off"></el-input>
                </el-form-item>
                <!-- <el-form-item label="用户名" prop="git_username">
					<el-input  v-model="addForm.git_username" auto-complete="off" ></el-input>
				</el-form-item>
				<el-form-item label="用户密码" prop="git_password">
                    <el-input  v-model="addForm.git_password" auto-complete="off" type="password"></el-input>
				</el-form-item> -->
                <el-form-item label="文件夹名" v-show="addForm.codetype==0">
                    <el-input v-model="addForm.folder" auto-complete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="addFormVisible = false">取消</el-button>
                <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
            </div>
        </el-dialog>
        <!--新增界面-->
        <el-dialog v-model="qrVisible" :close-on-click-modal="false">
            <div class="qrWrapper" v-loading="qrLoading" element-loading-text="拼命加载中">
                <el-dropdown v-if="!qrLoading" @command="handleCommand" style="position:absolute;left:45%;top:20px;">
                    <el-button type="primary">
                        {{dropdownText}}
                        <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item :command="branch" v-for="branch in branches">{{branch}}</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <div class="state">{{state}}</div>
                <img class="previewImage" :src="'data:image/jpeg;base64,'+previewImage" />
                <el-button type="primary" @click.native="goMaking" style="position:absolute;left:50%;bottom:20px;margin-left:-30px;" :loading="addLoading">提交</el-button>
            </div>
        </el-dialog>
    </section>
</template>

<script>
import util from "../../common/js/util";
//import NProgress from 'nprogress'
import {
  getGitList,
  removeUser,
  batchRemoveUser,
  editGit,
  addGit,
  deleteGit,
  preview,
  cloneGit,
  getBranches,
  fetchState
} from "../../api/api";
export default {
  data() {
    return {
      filters: {
        id: ""
      },
      defalutBlank:
        "iVBORw0KGgoAAAANSUhEUgAAACkAAAAlCAYAAADfosCNAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA+SURBVFhH7c5BDQAwEASh+je9NcHnkkEBbweUVEoqJZWSSkmlpFJSKamUVEoqJZWSSkmlpFJSKamUVEoa2we/6J2mM5bfCgAAAABJRU5ErkJggg==",
      previewImage: this.defalutBlank,
      dropdownText: "git分支",
      list: [],
      total: 0,
      page: 0,
      listLoading: false,
      sels: [], //列表选中列
      editFormVisible: false, //编辑界面是否显示
      editLoading: false,
      //编辑界面数据
      qrLoading: false,
      qrVisible: false,
      folderOptionVisible: false,
      addFormVisible: false, //新增界面是否显示
      addLoading: false,
      FormRules: {
        project_name: [
          { required: true, message: "请输入项目名", trigger: "blur" }
        ],
        git_url: [
          { required: true, message: "请输入项目地址", trigger: "blur" }
        ]
        // git_username: [
        //   { required: true, message: "请输入git用户名", trigger: "blur" }
        // ],
        // git_password: [
        //   { required: true, message: "请输入git密码", trigger: "blur" }
        // ]
      },
      //新增界面数据
      branches: [],
      editForm: {
        project_name: "",
        git_url: "",
        git_password: "",
        git_username: "",
        folder: "",
        codetype: ""
      },
      addForm: {
        project_name: "",
        git_url: "",
        git_password: "",
        git_username: "",
        folder: "",
        codetype: "1"
      },
      state: ""
    };
  },
  methods: {
    handleCurrentChange(val) {
      this.page = val - 1;
      this.getList();
    },
    handleCommand(command) {
      this.dropdownText = command;
    },
    //获取用户列表
    getList() {
      let para = {
        pageNum: this.page,
        id: this.filters.id
      };
      this.listLoading = true;
      //NProgress.start();
      getGitList(para).then(res => {
        if (res.data.list.length) {
          this.total = res.data.list[0].total;
        } else {
          this.total = 0;
        }
        this.list = res.data.list;
        this.list.forEach(item => {
          item.isWepy = item.codetype == 1 ? "是" : "否";
        });
        this.listLoading = false;
        //NProgress.done();
      });
    },
    //删除
    handleDel: function(index, row) {
      this.$confirm("确认删除该记录吗?", "提示", {
        type: "warning"
      })
        .then(() => {
          this.listLoading = true;
          //NProgress.start();
          let para = { id: row.id };
          deleteGit(para).then(res => {
            this.listLoading = false;
            //NProgress.done();
            this.$message({
              message: "删除成功",
              type: "success"
            });
            this.getList();
          });
        })
        .catch(() => {});
    },
    //显示编辑界面
    handleEdit: function(index, row) {
      this.editForm = Object.assign({}, row);
      console.log(this.editForm);
      this.editFormVisible = true;
    },
    makeQR: function(index, row) {
      this.dropdownText = "git分支";
      this.addForm = Object.assign({}, row);
      this.previewImage = this.defalutBlank;
      const para = Object.assign({}, this.addForm);
      getBranches(para).then(res => {
        console.log(res);
        var arr = res.data.filter(function(item, pos) {
          return res.data.indexOf(item) == pos;
        });
        this.branches = arr;
        this.qrVisible = true;
      });
    },
    FetchState: function() {
      fetchState().then(res => {
        this.state = res.msg;
        console.log(res);
      });
    },
    goMaking: function() {
      if (this.dropdownText === "git分支") {
        this.$message.error("请选择git分支");
        return;
      }
      this.qrLoading = true;
      let para = Object.assign({}, this.addForm);
      para.branch = this.dropdownText;
      try {
        this.FetchState();
        const t = setInterval(this.FetchState, 2000);
        preview(para)
          .then(res => {
            clearInterval(t);
            console.log(res);
            this.state = "";
            if (res.base64) {
              this.previewImage = res.base64;
            } else {
              this.$message.error(res.msg);
            }
            this.qrLoading = false;
          })
          .catch(err => {
            this.$message.error("出错了,请确保git信息填写正确..");
            this.previewImage = this.defalutBlank;
            this.qrVisible = false;
            this.qrLoading = false;
          });
      } catch (err) {
        this.$message.error("出错了.." + err.message);
      }
    },
    //显示新增界面
    handleAdd: function() {
      this.addFormVisible = true;
      this.addForm = {
        project_name: "",
        git_url: "",
        git_password: "",
        git_username: "",
        folder: "",
        codetype: "1"
      };
    },
    //编辑
    editSubmit: function() {
      this.$refs.editForm.validate(valid => {
        if (valid) {
          this.$confirm("确认提交吗？", "提示", {}).then(() => {
            this.editLoading = true;
            //NProgress.start();
            let para = Object.assign({}, this.editForm);
            editGit(para).then(res => {
              this.editLoading = false;
              //NProgress.done();
              this.$message({
                message: "提交成功",
                type: "success"
              });
              this.$refs["editForm"].resetFields();
              this.editFormVisible = false;
              this.getList();
            });
          });
        }
      });
    },
    //新增
    addSubmit: function() {
      this.$refs.addForm.validate(valid => {
        if (valid) {
          this.$confirm("确认提交吗？", "提示", {}).then(() => {
            this.qrLoading = true;
            this.addLoading = true;
            //NProgress.start();
            let para = Object.assign({}, this.addForm);
            try {
              //NProgress.done();
              cloneGit(para).then(res => {
                console.log(res);
                console.log("ffffff");
                if (res.code != 200) {
                  this.$message({
                    message: "提交失败,请确保git地址正确",
                    type: "error"
                  });
                  this.qrLoading = false;
                  this.addLoading = false;
                  return;
                }
                addGit(para).then(res => {
                  this.qrLoading = false;
                  this.addLoading = false;
                  this.$message({
                    message: "提交成功",
                    type: "success"
                  });
                  this.$refs["addForm"].resetFields();
                  this.addFormVisible = false;
                  this.getList();
                });
              });
            } catch (err) {
              this.qrLoading = false;
              this.addLoading = false;
            }
          });
        }
      });
    },
    selsChange: function(sels) {
      this.sels = sels;
    },
    //批量删除
    batchRemove: function() {
      var ids = this.sels.map(item => item.id).toString();
      this.$confirm("确认删除选中记录吗？", "提示", {
        type: "warning"
      })
        .then(() => {
          this.listLoading = true;
          //NProgress.start();
          let para = { id: ids };
          deleteGit(para).then(res => {
            this.listLoading = false;
            //NProgress.done();
            this.$message({
              message: "删除成功",
              type: "success"
            });
            this.getList();
          });
        })
        .catch(() => {});
    }
  },
  mounted() {
    this.getList();
  }
};
</script>

<style scoped>
.qrWrapper {
  width: 300px;
  height: 400px;
  margin: 0 auto;
}
.qrWrapper img {
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
}
.qrWrapper .previewImage {
  position: absolute;
  width: 320px;
  height: 320px;
  left: 50%;
  top: 60%;
  transform: translate(-50%, -50%);
}
.state {
  display: block;
  color: rgb(48, 157, 247);
  font-size: 20px;
  position: absolute;
  left: 50%;
  top: 34%;
  transform: translate3d(-50%, -50%, 0);
  z-index: 99999;
}
</style>