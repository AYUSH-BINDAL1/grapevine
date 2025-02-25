import { useState } from 'react';
import './App.css';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import * as React from 'react';
import axios from 'axios';

function App() {
  const [employees, setEmployees] = useState([]);
  const columns = React.useMemo(() => [
    { Header: "EmployeeId", accessor: "employeeId" },
    { Header: "Name", accessor: "name" },
    { Header: "Manager", accessor: "manager" },
    { Header: "Salary", accessor: "salary" },
    {
      Header: "Edit", id: "Edit", accessor: "edit",
      Cell: props => (<button className='editBtn' onClick={() => handleUpdate(props.cell.row.original)}>Edit</button>)
    },
    {
      Header: "Delete", id: "Delete", accessor: "delete",
      Cell: props => (<button className='deleteBtn' onClick={() => handleDelete(props.cell.row.original)}>Delete</button>)
    }
  ], []);

  const data = React.useMemo(() => employees, []);
  const [employeeData, setEmployeeData] = useState({ name: "", manager: "", salary: "" });
  const [showCancel, setShowCancel] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } = useTable({ columns, data: employees }, useSortBy);
  const { globalFilter } = state;

  const getAllemployees = () => {
    axios.get('http://localhost:8085/employees').then((res) => {
      console.log(res.data);
      setEmployees(res.data);
    });
  };

  const handleUpdate = (emp) => {
    setEmployeeData(emp);
    setShowCancel(true);
  };

  const handleDelete = (emp) => {
    const isConfirmed = window.confirm("Are you sure you want to delete?");
    if (isConfirmed) {
      axios.delete('http://localhost:8085/employees/' + emp.employeeId).then((res) => {
        console.log(res.data);
        setEmployeeData(res.data);
      });
    }

    window.location.reload();
  };

  const handleChange = (e) => {
    setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
    setErrMsg("");
  };

<<<<<<< HEAD:employee-web/src/App.jsx
  const clearAll = () => {
    setEmployeeData({ name: "", manager: "", salary: "" });
    getAllemployees();
  };
=======
  const clearAll=()=>{
    setEmployeeData({name:"",manager:"",salary:""});
    getAllemployees();
  }
>>>>>>> 0cac489055129ab98ad21a8bdd3efe1456261be3:demo/employee-web/src/App.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errmsg = "";
    if (!employeeData.name || !employeeData.manager || !employeeData.salary) {
      errmsg = "All field are required!";
      setErrMsg(errmsg);
    }
    if ((errmsg.length === 0) && employeeData.employeeId) {
      await axios.patch('http://localhost:8085/employees/' + employeeData.employeeId, employeeData).then((res) => {
        console.log(res.data);
      });
    } else if (errmsg.length === 0) {
      await axios.post('http://localhost:8085/employees', employeeData).then((res) => {
        console.log(res.data);
      });
    }
    clearAll();
  };

  const handleCancel = () => {
    setEmployeeData({ name: "", manager: "", salary: "" });
    setShowCancel(false);
  };

  React.useEffect(() => {
    getAllemployees();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const user = {
      userEmail: email,
      password: password,
      name: `${firstName} ${lastName}`,
      birthday: '2000-01-01', // You can replace this with a dynamic value if needed
      role: 'STUDENT'
    };

    try {
      const response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        alert('User registered successfully');
      } else {
        alert('Failed to register user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <>
      <div className='main-container'>
        <h3>Full Stack Application using React, 
        Spring Boot, & PostgreSQL</h3>
        {errMsg && <span className='error'>{errMsg}</span>}
        <div className='add-panel'>
          <div className='addpaneldiv'>
<<<<<<< HEAD:employee-web/src/App.jsx
            <label htmlFor="First Name">First Name</label><br />
            <input
              className="addpanelinput"
              type="text"
              name="firstName"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="Last Name">Last Name</label><br />
            <input
              className="addpanelinput"
              type="text"
              name="lastName"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="University Email">Purdue Email</label><br />
            <input
              className="addpanelinput"
              type="text"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="Password">Password</label><br />
            <input
              className="addpanelinput"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="Confirm Password">Confirm Password</label><br />
            <input
              className="addpanelinput"
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className='addBtn' onClick={handleRegister}>Register</button>
          <button className='addBtn'>Sign in</button>
=======
            <label htmlFor="name">Name</label> <br />
            <input className='addpanelinput' value={employeeData.name} onChange={handleChange} type="text" name='name' id='name'/>
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="manager">Manager</label> <br />
            <input className='addpanelinput' value={employeeData.manager} onChange={handleChange} type="text" name='manager' id='manager'/>
          </div>
          <div className='addpaneldiv'>
            <label htmlFor="salary">Salary</label> <br />
            <input className='addpanelinput' value={employeeData.salary} onChange={handleChange} type="text" name='salary' id='salary'/>
          </div>
          <button className='addBtn' onClick={handleSubmit}>{employeeData.employeeId?"Update":"Add"}</button>
          <button className='cancelBtn' disabled={!showCancel} onClick={handleCancel}>Cancel</button>
>>>>>>> 0cac489055129ab98ad21a8bdd3efe1456261be3:demo/employee-web/src/App.jsx
        </div>
        <input className='searchinput' value={globalFilter || ""} onChange={(e)=>setGlobalFilter(e.target.value)} type="search" name="inputsearch" id="inputsearch" placeholder="Search Employees Here"/>
      </div>
<<<<<<< HEAD:employee-web/src/App.jsx
=======
      <table className='table' {...getTableProps()}>
        <thead>
          {headerGroups.map((hg)=>(
            <tr {...hg.getHeaderGroupProps()} key={hg.id}>
              {hg.headers.map((column)=>(
                <th {...column.getHeaderProps(column.getSortByToggleProps())} key={column.id}> {column.render('Header')}
                <span>
                  {column.isSorted?(column.isSortedDesc?'⬇️':'⬆️'):""}
                </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row)=>{
            prepareRow(row)
            return(
              <tr {...row.getRowProps()} key={row.id}>
                {row.cells.map((cell)=>{
                  return <td {...cell.getCellProps()} key={cell.id}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
>>>>>>> 0cac489055129ab98ad21a8bdd3efe1456261be3:demo/employee-web/src/App.jsx
    </>
  );
}

export default App;
