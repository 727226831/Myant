const getters = {
  device: state => state.app.device,
  theme: state => state.app.theme,
  color: state => state.app.color,
  // token: state => state.user.token,
  token: state => {if (!state.token) {
                    state.token = localStorage.getItem('token')
                  }
                  return state.token
                  },
  avatar: state => state.user.avatar,
  nickname: state => state.user.name,
  welcome: state => state.user.welcome,
  roles: state => state.user.roles,
  basepersonPO: state => state.user.basepersonPO,
  baseenterprisePO: state => state.user.baseenterprisePO,
  userInfo: state => state.user.info,
  addRouters: state => state.permission.addRouters,
  multiTab: state => state.app.multiTab,
  lang: state => state.i18n.lang
}

export default getters
