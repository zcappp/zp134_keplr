import React from "react"
import css from "../css/zp134_资源管理.css"

const DB = { res: ["j", "w", "l", "p"], resource: ["i", "v", "f"] }
const Labels = { res: "系统上传", resource: "用户上传", j: "图片", w: "视频", l: "文件", p: "文件夹", i: "图片", v: "视频", f: "文件" }
const OPT = { sort: "按下载量排序", del: "已标记删除的资源", noview: "无访问的资源" }
const noviews = { 三个月: 3, 半年: 6, 一年: 12, 两年: 24, 三年: 36 }
let exc, rd, id, db, type, opt, sort, sorts, noview, data, count, list, Q, O, pop, editor, editorpop

function render() {
    return <React.Fragment>
        <div className="top">
            <strong>资源管理</strong>
            <ul>{Object.keys(DB).map((a, i) => <li onClick={() => selectDB(a)} className={"ztab" + (a === db ? " zcur" : "")} key={i}>{Labels[a]}</li>)}</ul>
            <ul>{Object.keys(OPT).map((a, i) => <li onClick={() => selectOpt(a)} className={"ztab" + (a === opt ? " zcur" : "")} key={i}>{OPT[a]}</li>)}</ul>
        </div>
        <div className="type">
            <ul>{DB[db].map((a, i) => <li onClick={() => selectType(a)} className={"ztab" + (a === type ? " zcur" : "")} key={i}>{Labels[a]}</li>)}</ul>
            <span>{rOPT()}</span>
        </div>
        <table className={"ztable " + db}>
            <thead><tr><th>文件</th><th>大小</th><th>上传人</th><th>上传时间</th></tr></thead>
            <tbody>{list.map((o, i) => 
                <tr onClick={() => selectData(o)} className={(i % 2 ? "" : "zodd") + (data && data._id === o._id ? " cur" : "")} key={i}>
                    <td><a href={o.url} target="_blank">{o.name}</a></td>
                    <td>{o.size > 1024 ? Math.round(o.size / 1024) + "M" : o.size + "K"}</td>
                    <td>{userName(o.auth)}</td>
                    <td>{exc(`date("${o._id}")`).format()}</td>
                </tr>)}
                <tr className="observer"></tr>
            </tbody>
        </table>
        <div className="detail">
            {!data && !!count && db === "resource" && opt === "noview" && <div><div style={{marginBottom: "9px"}}>总数：{count || ""}</div>
                <div onClick={dels} className="zbtn">删除</div>
            </div>}
            <div className={data ? "" : "zhide"}><div className="jsoneditor"/></div>
            {data && <div>
                <div style={{margin: "7px 0"}}><strong>_id: </strong>{data._id}</div>
                {db === "resource" && <button onClick={() => popup("x")} className={"zbtn" + (data.x && Object.keys(data.x).length ? " zprimary" : "")}>x</button>}
                {db === "resource" && <button onClick={() => popup("y")} className={"zbtn" + (data.y && Object.keys(data.y).length ? " zprimary" : "")}>y</button>}
                <div className="zfright">
                    {db === "resource" && opt !== "del" && <button onClick={del} className="zbtn">删除</button>}
                    {opt === "del" && <button onClick={undel} className="zbtn">恢复</button>}
                </div>
                {!!pop && <div className="zmodals">
                    <div className="zmask" onClick={() => {pop = undefined; rd()}}/>
                    <div className="zmodal">
                        <div className="zmodal_bd editorpop"/>
                        {pop === "y" && <div className="zmodal_ft"><button onClick={saveY} className="zbtn" style={{marginRight: 0}}>保存</button></div>}
                    </div>
                </div>}
            </div>}
        </div>
    </React.Fragment>
}

function rOPT() {
    if (!opt) return <React.Fragment>
        <input onBlur={toSearch} type="text" placeholder='{ "x.类型": "网盘" }' className="zinput"/>
        <button onClick={toSearch} className="zbtn">搜索</button>
    </React.Fragment>
    if (opt === "sort") return <React.Fragment>
        按 <select value={sort} onChange={optSearch.sort} className="zinput">
            {sorts.map(a => <option value={a} key={a}>{a}</option>)}
        </select> 天前的下载量排序 ({new Date(new Date() - 86400000 * sort).format("yyyy/MM/dd")})
    </React.Fragment>
    if (opt === "noview") return <React.Fragment>
        <select value={noview} onChange={optSearch.noview} className="zinput">
            {Object.keys(noviews).map(a => <option value={a} key={a}>{a}</option>)}
        </select> 无访问
    </React.Fragment>
}

function init(ref) {
    exc = ref.exc
    rd = ref.render
    id = ref.id
    db = "res"
    type = "j"
    list = []
    sorts = exc('array(30, 2, 1)')
    initData()
    exc('load("//z.zccdn.cn/vendor/monaco_0.31.1/monaco-loader.min-1.2.0.js")', null, () => {
        monaco_loader.config({ paths: { vs: "//z.zccdn.cn/vendor/monaco_0.31.1/vs" } })
        monaco_loader.init().then(monaco => {
            editor = monaco.editor.create($("#" + id + " .jsoneditor"), {
                language: "json",
                value: "{}",
                readOnly: true,
                tabSize: 2,
                lineNumbers: "off",
                fixedOverflowWidgets: true,
                minimap: { enabled: false },
                scrollbar: { alwaysConsumeMouseWheel: false },
                formatOnPaste: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
            })
        })
        const o = new IntersectionObserver(entries => entries.forEach(editor => {
            if (!editor.intersectionRatio) return
            if (list && count > list.length) {
                O.skip = list.length
                exc(`$resource.search("zp134.type", Q, O, null, 1, z)`, { type, Q, O, z: db === "res" }, R => {
                    list = list.concat(R.arr)
                    count = R.count
                    getUsers(R)
                    rd()
                })
            }
        }), {})
        o.observe($("#" + id + " .observer"))
    })
}

function search() {
    exc(`$resource.search("zp134." + type, Q, O, null, 1, z)`, { type, Q, O, z: db === "res" }, R => {
        list = R.arr
        count = R.count
        getUsers(R)
        rd()
    })
}

function initData() {
    Q = { type }
    O = { limit: 30, skip: 0, sort: { _id: -1 } }
    search()
}

function selectDB(_db) {
    db = _db
    list = []
    opt = undefined
    data = undefined
    count = undefined
    type = db === "res" ? "j" : "i"
    initData()
}

function selectType(_type) {
    type = _type
    data = undefined
    list = []
    O.skip = 0
    Q.type = type
    search()
}

function selectData(o) {
    data = o
    editor.setValue(o.v && Object.keys(o.v).length ? JSON.stringify(o.v, null, "\t") : "{\n\n\n}")
    rd()
}

function selectOpt(k) {
    if (opt === k) {
        opt = undefined
        initData()
    } else {
        opt = k
        optSearch[k]()
    }
}

const optSearch = {
    sort: e => {
        data = undefined
        if (e) sort = e.target.value
        if (!sort) sort = 2
        let f = new Date(new Date() - 86400000 * sort).format("yyyy/MM/dd").split("/").join("")
        f = "v." + f.substr(0, 6) + "." + f.substr(6)
        Q = { type }
        Q[f] = { $exists: true }
        O = { limit: 30, skip: 0, sort: {} }
        O.sort[f] = -1
        search()
    },
    del: e => {
        data = undefined
        Q = { type, status: { $exists: true } }
        O = { limit: 30, skip: 0, sort: { status: 1 } }
        search()
    },
    noview: e => {
        data = undefined
        if (e) noview = e.target.value
        if (!noview) noview = "三个月"
        Q = { type, status: { $exists: false }, _id: { $lt: Math.round((new Date(new Date() - 86400000 * 30 * 3)).getTime() / 1000).toString(16) + "0000000000000000" } } // { "v.202105": { $exists: false } }
        let m = new Date().getMonth() + 2
        let y = new Date().getFullYear()
        for (let i = 0; i < noviews[noview]; i++) {
            m = m - 1
            if (m == 0) {
                y = y - 1
                m = 12
            }
            Q["v." + y + (m < 10 ? "0" + m : m)] = { $exists: false }
        }
        Q._id = { "$lt": exc('_id(d)', { d: new Date(y, m, 1) }) }
        O = { limit: 30, skip: 0 }
        search()
    },
}

function popup(k) {
    pop = k
    rd()
    setTimeout(() => {
        editorpop = monaco.editor.create($("#" + id + " .editorpop"), {
            language: "json",
            value: data[k] && Object.keys(data[k]).length ? JSON.stringify(data[k], null, "\t") : "{\n\n\n}",
            tabSize: 2,
            lineNumbers: "off",
            fixedOverflowWidgets: true,
            minimap: { enabled: false },
            scrollbar: { alwaysConsumeMouseWheel: false },
            formatOnPaste: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
        })
    }, 9)
}

function getUsers(R) {
    if (!R || !R.arr) return
    let arr = []
    R.arr.map(a => a.auth).forEach(a => {
        if (a && !arr.includes(a) && !exc('$c.user[auth]', { auth: a })) arr.push(a)
    })
    if (!arr.length) return
    R.model == "res" ? exc(`$srv.用户列表({ arr }, "a0")`, { arr }, () => rd()) : exc(`$user.search("zp134.user", Q, O)`, { Q: { _id: { $in: arr } }, O: { limit: 0, select: "x.姓名 x.name wx.nickname" } }, () => rd())
}

function userName(auth) {
    const o = exc('$c.user[auth]', { auth })
    let x = ""
    if (!o) return x
    if (o.x) x = o.x.姓名 || o.x.name
    if (!x && o.wx) x = o.wx.nickname
    return x
}

function toSearch() {
    Q = $("#" + id + " .type input").value
    if (!Q || !Q.startsWith("{") || !Q.endsWith("}")) return exc('warn("搜索条件必须是合法的json")')
    Q = exc(Q)
    if (typeof Q !== "object") return exc(`alert("搜索条件必须是合法的json")`)
    Q.type = type
    O.skip = 0
    search()
}

function save() {
    let U
    try {
        U = JSON.parse(editor.getValue())
    } catch (e) {
        return exc(`alert("数据不合法", "${e.message}")`)
    }
    exc(`confirm("注意", "确定要保存更改吗?"); $resource.modify(_id, U); $r._id ? info("已保存") : warn("保存失败")`, { _id: data._id, U })
}

function saveY() {
    let U = { $unset: {} }
    try {
        const o = JSON.parse(editorpop.getValue())
        Object.keys(o).forEach(k => U["y." + k] = o[k])
        if (data.y) Object.keys(data.y).forEach(k => { if (o[k] === undefined) U.$unset["y." + k] = "" })
    } catch (e) {
        return exc(`alert("数据不合法", "${e.message}")`)
    }
    exc(`confirm("注意", "确定要保存更改吗?"); $resource.modify(_id, U); $r._id ? info("已保存") : warn("保存失败")`, { _id: data._id, U })
}

function del() {
    exc(`confirm("将标记为删除", "10天内无访问即彻底删除，30天内即使有访问但未手动恢复也彻底删除"); $resource.delete(_id); $r._id ? info("已标记删除") : warn("删除失败"); render()`, { _id: data._id }, () => optSearch.noview())
}

function undel() {
    exc(`$resource.undelete(_id, z); $r && $r._id && !$r.status ? info("已恢复") : warn("恢复失败"); render()`, { _id: data._id, z: db === "res" }, () => optSearch.del())
}

function dels() {
    const cmd = `
    confirm("危险!", "将会批量标记删除此类型下的所有数据? 共有${count}个!")
    $resource.search("zp134.dels" + type, Q, O)
    $r.arr ? $r.arr.map('$x._id').forEach('$resource.delete($x)') : warn("出错了")
    info("删除完成")
    `
    exc(cmd, { type, Q, O: { limit: 0, select: "_id" } }, () => selectDB(db))
}

function calls(arr, fn, next) {
    let cb = {
        [arr.length]: () => next()
    }
    for (let i = arr.length - 1; i > 0; i--) {
        cb[i] = () => fn(arr[i], cb[i + 1])
    }
    fn(arr[0], cb[1])
}

$plugin({
    id: "zp134",
    render,
    init,
    css
})