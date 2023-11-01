import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// useStateを読み込む
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Route, useParams, Routes, Outlet, useLocation } from 'react-router-dom';
import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { jaJP } from "gridjs/l10n";



//app.cssを読み込む
import './App.css';

const GroupList = ({ groups, keyProp }) => {
  /*urlから/で区切られた最後の文字列を取得*/
  let group_name = window.location.href.split("/").pop();
  /*group_nameを-で区切る*/
  let group_name_split = group_name.split("-");
  /*group_name_splitの最初の要素を取得*/
  let group_name_split_first = group_name_split[0];

  const show = keyProp === group_name_split_first ? "show" : "";
  const show_onoff = keyProp === group_name_split_first ? "true" : "false";
  const select_now_all = group_name_split.length === 1 && group_name_split[0] === keyProp ? "select-now" : "";

  return (
    <li className="mb-1">
      <button className="btn btn-toggle d-inline-flex align-items-center rounded border-0 w-100 bg-secondary text-w" data-bs-toggle="collapse" data-bs-target={`#${keyProp}`} aria-expanded={show_onoff}>
        {keyProp}
      </button>
      <div className={`collapse ${show}`} id={keyProp}>
        <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
          {keyProp !== "single" && <li><a href={"/group/" + keyProp} className={`link-body-emphasis d-inline-flex text-decoration-none rounded ${select_now_all}`}>all</a></li>}
          {Object.keys(groups).map((keykobetu) => {
            let select_now = "";
            if (group_name_split.length === 2) {
              select_now = show_onoff === "true" && keykobetu === group_name_split[1] ? "select-now" : "";
            }
            return (
              <li>
                <a href={ "/grouplist/" + keyProp + "-" + groups[keykobetu]} className={`link-body-emphasis d-inline-flex text-decoration-none rounded ${select_now}`}>{keykobetu}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  )
}

function SideBar() {
  /* localhost:8000/api/group_info からグループ情報を取得 */
  const [groups, setGroups] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/api/group_info')
      .then(response => response.json())
      .then(data => setGroups(data))
      .catch(error => console.error(error));
  }, []);


  return (
    <div className="flex-shrink-0 p-1 sidebar bg-secondary" style={{ overflowY: 'scroll' }}>
      <ul className="list-unstyled ps-0">

        {Object.keys(groups).map((keykobetu) => (
          typeof groups[keykobetu] === 'string' ?
            <li key={keykobetu}>
              <a href={"/grouplist/single-" + groups[keykobetu]} className="link-body-emphasis d-inline-flex text-decoration-none rounded w-100">{groups[keykobetu]}</a>
            </li>
            :
            <GroupList groups={groups[keykobetu]} keyProp={keykobetu} />
        ))}

      </ul>
    </div>
  );
}

function MyHeader() {
  return (
    <Navbar expand="lg" className='myheader'>
      <Container>
        <Navbar.Brand href="/">Project Pylearn</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Link</Nav.Link> */}

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}


async function fetchGroupData(group) {
  const settings = {
    "accuracy": { name: "acc" },
    "auc": { name: "auc" },
    "blanced_accuracy": { name: "bl_acc" },
    "cutoff": { name: "cutoff" },
    "datetime": { name: "datetime", hidden: true },
    "f1": { name: "f1" },
    "group_name": { name: "group_name", hidden: true },
    "id": { name: "id", hidden: true },
    "log_folder": { name: "log_folder", hidden: true },
    "precision": { name: "precision" },
    "run_name": { name: "run_name", resizable: true },
    "sensitivity": { name: "sensitivity" },
    "specificity": { name: "specificity" }
  }
  const response = await fetch('http://localhost:8000/api/get_statistics_data?' + group);
  const data = await response.json();
  /*取得したデータは{"key1":{column1: value1, column2: value2, ...}, "key2":{column1: value1, column2: value2, ...}}の形式なので、
  {header:[column1, column2, ...], data:[[value1, value2, ...], ...]}の形式に変換する*/
  let keys = Object.keys(data);
  console.log(keys);
  console.log(data);
  let header_name = Object.keys(data[keys[0]]);
  let dataval = [];

  /*header_nameの個数によって処理を変える*/
  if (header_name.length >= 7) {
    header_name = ["run_name", "blanced_accuracy", "auc", "accuracy", "precision", "f1", "specificity", "sensitivity", "cutoff", "datetime", "group_name", "id", "log_folder"]
  }
  else {
    header_name = ["run_name", "accuracy", "datetime", "group_name", "id", "log_folder"]
  }

  let header_obj = []
  /*keysをひとつずつ取り出す*/
  for (let i = 0; i < keys.length; i++) {
    let data_1 = [];
    for (let j = 0; j < header_name.length; j++) {
      data_1.push(String(data[keys[i]][header_name[j]]));
      if (i === 0) {
        header_obj.push(settings[header_name[j]]);
      }
    }

    dataval.push(data_1);
  }
  return { "header": header_obj, "data": dataval };
}

function GroupContent() {

  const wrapper = useRef(null);
  const { group } = useParams();
  const urlquery = "group_name=" + group;
  /* localhost:8000/api/group_data/<group_name> からグループ情報を取得 */

  const grid = new Grid({
    columns: ["tmp_data"],
    data: [
      ['tmp_data'],
    ]
  })

  useEffect(() => {
    const fetchData = async () => {
      const group_data = await fetchGroupData(urlquery);

      grid.on('rowClick', (...args) => {
        /*遷移するかalertで確認する*/
        /*group_dataからheaderを取得して、clickしたrowの中からrun_nameとgroup_nameを取得する*/
        let header = group_data.header;
        let run_name = "";
        let group_name = "";
        for (let i = 0; i < header.length; i++) {
          if (header[i].name === "run_name") {
            run_name = args[1].cells[i].data;
          }
          else if (header[i].name === "group_name") {
            group_name = args[1].cells[i].data;
          }
        }
        if (!window.confirm(`${run_name}のページに遷移しますか？`)) {
          return;
        }
        //run_nameとgroup_nameを用いて、個別のページに飛ぶ
        window.location.href = "/grouplist/" + group_name + "-" + run_name;

      });
      grid.render(wrapper.current);

      grid.updateConfig({
        search: true,
        language: jaJP,
        sort: true,
        pagination: { limit: 5 },
        columns: group_data.header,
        data: group_data.data,
      }).forceRender();
    };
    fetchData();
  }, [group]);

  return (
    <div className='sidebar' style={{ overflowY: 'scroll' }}>
      <h1>{group}</h1>
      <div ref={wrapper}></div>
    </div>
  );
}

function StrCsvToList(str_csv) {

  let list = [];
  let ps = str_csv.split("\n");
  for (let i = 0; i < ps.length; i++) {
    list.push(ps[i].split(","));
  }
  return list;
}



async function fetchIndividualData({ log_folder, run_name }) {
  /*/api/get_log_dataに対して、type、run_name、logをキーとしたjsonを送信する*/
  console.log(log_folder);
  const requestData = {
    type: "individual_data",
    run_name: run_name,
    log: log_folder.replace('---', '/')
  };

  const response = await fetch("http://localhost:8000/api/get_log_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });
  const csvData = await response.text();

  /*StrCsvToList関数を用いて、csvをlistに変換する*/
  /*また、listの最初の要素をheaderとして取得する*/
  let list = StrCsvToList(csvData);
  let header = list[0];
  list.shift();

  //headerの0番目を{name:"path",hidden:true}に変更する
  header[0] = { name: "path", hidden: true };
  header[1] = "actual";
  header[2] = "predict";

  console.log(header);
  //listの[i][0]と[i][1]以外の要素を数値に変換したうえで少数第3位までにする。
  for (let i = 0; i < list.length; i++) {
    for (let j = 3; j < list[i].length; j++) {
      list[i][j] = Number(list[i][j]).toFixed(7);
    }
  }

  return { "header": header, "data": list };

}

function CmTable({ groupData }) {
  /*typeはconfusion_matrx*/
  /*run_nameはgroup_runから取得する*/
  let run_name = "";
  let log_folder = "";

  for (let i = 0; i < groupData.header.length; i++) {

    if (groupData.header[i].name === "run_name") {
      run_name = groupData.data[0][i];
    }
    else if (groupData.header[i].name === "log_folder") {
      log_folder = groupData.data[0][i];
    }
  }

  /*/api/get_log_dataに対して、type、run_name、logをキーとしたjsonを送信する*/
  const requestData = {
    type: "confusion_matrix",
    run_name: run_name,
    log: log_folder,
  };
  const [Cmdata, setCmdata] = useState(null);
  useEffect(() => {
    fetch("http://localhost:8000/api/get_log_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then(response => response.json())
      .then(data => setCmdata(StrCsvToList(data["data"])))
      .catch(error => console.error(error));
  }, []);

  return (
    <table className="table table-bordered">
      <thead>
        <tr>
          {Cmdata === null ? (
            <div>Loading...</div>
          ) : (
            Object.keys(Cmdata[0]).map((key) => (
              <th>{Cmdata[0][key]}</th>
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {Cmdata === null ? (
          <div>Loading...</div>
        ) : (
          Cmdata.slice(1).map((row) => {
            return (<tr>
              {Object.keys(row).map((key) => (
                <td>{row[key]}</td>
              ))}
            </tr>)
          })
        )}
      </tbody>

    </table>
  );
}

function SingleContent() {
  const wrapper = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [ImagePath, setImagePath] = useState(null);
  const { group_run } = useParams();
  const location = useLocation().search;

  const param = new URLSearchParams(location);


  const urlquery = "group_name=" + group_run.split("-")[0] + "&run_name=" + group_run.split("-")[1];
  const grid = new Grid({
    columns: ["tmp_data"],
    data: [
      ['tmp_data'],
    ]
  })

  useEffect(() => {
    const GroupData = async () => {
      const group_data = await fetchGroupData(urlquery);

      grid.render(wrapper.current);

      grid.updateConfig({
        sort: true,
        autoWidth: true,
        language: jaJP,
        columns: group_data.header,
        data: group_data.data,
      }).forceRender();
      setGroupData(group_data);
      setIsLoading(false);
    };
    const IndividualData = async () => {
      const individual_data = await fetchIndividualData({ log_folder: param.get("log"), run_name: group_run.split("-")[1]});
      grid.on('rowClick', (...args) => {
        let image_path=args[1].cells[0].data;
        ///を---に置換する
        image_path = image_path.replace(/\//g, "---");
        setImagePath(image_path);
      });
      grid.render(wrapper.current);
      grid.updateConfig({
        search: true,
        sort: true,
        autoWidth: true,
        language: jaJP,
        pagination: { limit: 5 },
        columns: individual_data.header,
        data: individual_data.data,
      }).forceRender();
    }
    if (param.get("log") == null) {
      GroupData();
    }
    else {
      IndividualData();
    }
  }
    , [group_run]);

  let img_url = "#";
  let log_folder = "";
  let switch_col = 6;


  if (!isLoading) {
    for (let i = 0; i < groupData.header.length; i++) {
      if (groupData.header[i].name === "log_folder") {
        log_folder = groupData.data[0][i];
        // \/を_に置換する
        log_folder = log_folder.replace(/\//g, "---");

      }
      //cutoffを取得する

    }
    if (groupData.header.length < 7) {
      switch_col = 0;
    }
    else {
      img_url = "http://localhost:8000/api/get_roc_data?run_name=" + group_run.split("-")[1] + "&group_name=" + group_run.split("-")[0] + "&log=" + log_folder;
    }
  }


  function openImage() {
    let open_url = "http://localhost:8000/api/open_image?path=" + ImagePath;
    fetch(open_url)
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error(error));
  }

  function openFolder() {
    let open_url = "#"
    if (!isLoading) {
      open_url = "http://localhost:8000/api/open_explorer?log=" + log_folder + "---" + group_run.split("-")[1];
    }
    if(param.get("log") != null){
      open_url = "http://localhost:8000/api/open_explorer?log=" + param.get("log")+ "---" + group_run.split("-")[1];
    }

    fetch(open_url)
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error(error));
  }
  return (
    <div>
      <Container fluid>
        <Row>
          <Col xs={7}>
            <h2>統計情報({group_run.split("-")[1]})</h2>
          </Col>
          <Col xs={3}>
            {param.get("log") == null ? (
              <a href={`?log=${log_folder}`} className='btn btn-success'>Individual</a>
            ) : (
              <a href={`./${group_run}`} className='btn btn-success'>Comprehensive</a>
            )}
          </Col>
          <Col xs={2}>
            <button className="btn btn-primary" onClick={openFolder}>open folder</button>
          </Col>
        </Row>
      </Container>


      
      {param.get("log") == null ? (
        <>
          <div ref={wrapper}></div>
          <Container fluid>
            <Row>
              <Col xs={12 - switch_col}>
                <h3>混同行列</h3>
                <div className="graph toukei_height" style={{ overflow: 'scroll' }}>
                  {isLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <CmTable groupData={groupData} />
                  )}
                </div>
              </Col>
              <Col xs={switch_col}>
                <h3>ROC曲線</h3>
                <div className="graph toukei_height" >
                  <img src={img_url} className='w-75' alt="roc" />
                </div>

              </Col>
            </Row>
          </Container>
        </>
      ) : (
        <Container fluid>
          <Row>
            <Col xs={6}>
              <h2>選択画像</h2>
              <hr />
              {ImagePath === null ? (
                <h2>未選択</h2>
              ) : (
                <div >
                  <img src={"http://localhost:8000/api/get_image?path=" + ImagePath} alt="写真" className='w-75' onClick={openImage} />
                </div>
              )
              }
            </Col>
            <Col xs={6}>
              <div ref={wrapper}></div>
            </Col>

          </Row>
        </Container>
      )}

    </div>
  );

}

function License() {

  return (
    <div>

      <Container>
        <Row>
          <Col xs={1}></Col>
          <Col xs={10}>
            <h2 className='text-center'>MIT License</h2>
            <p>Copyright (c) 2023 shinn</p>
            <p>Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files(the "Software"), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions : </p>
            <p>The above copyright
              notice and this permission notice shall be included in all copies or
              substantial portions of the Software.</p>
            <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
              THE SOFTWARE.</p>
          </Col>
          <Col xs={1}></Col>
        </Row>
      </Container>

    </div>
  );
}

function MainFrame() {
  return (
    <>
      <MyHeader />
      <div id="main">
        <Container fluid className='sidebar'>
          <Row>

            <Col xs={2} className='p-0'><SideBar /></Col>
            <Col xs={10} className='p-2'>

              <Outlet />

            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}


function App() {
  return (

    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path='/' element={<MainFrame />}>
            <Route path="/" element={<License />} />
            <Route path="grouplist/:group_run" element={<SingleContent />} />
            <Route path="group/:group" element={<GroupContent />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter >
  );
}

export default App;
