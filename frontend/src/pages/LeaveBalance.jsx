import {
 useEffect,
 useState
} from "react";

import api from "../services/api";

export default function LeaveBalance() {

 const [balances,
   setBalances] =
   useState([]);

 useEffect(() => {
   loadBalances();
 }, []);

 const loadBalances =
   async () => {

     try {

       const response =
         await api.get(
           "/balances/my-balance"
         );

       setBalances(
         response.data
       );

     } catch(error){

       console.error(error);

     }

   };

 return (

   <div className="bg-white p-6 rounded shadow">

     <h1
      className="
      text-2xl
      font-semibold
      mb-6
      "
     >
       My Leave Balance
     </h1>

     <table className="w-full border">

       <thead>

         <tr className="bg-gray-100">

           <th className="border p-2">
             Leave Type
           </th>

           <th className="border p-2">
             Allocated
           </th>

           <th className="border p-2">
             Used
           </th>

           <th className="border p-2">
             Balance
           </th>

         </tr>

       </thead>

       <tbody>

         {balances.map(
           (row,index) => (

           <tr key={index}>

             <td className="border p-2">
               {row.code}
               {" - "}
               {row.name}
             </td>

             <td className="border p-2">
               {row.entitled_days}
             </td>

             <td className="border p-2">
               {row.used_days}
             </td>

             <td className="border p-2 font-semibold">
               {row.balance_days}
             </td>

           </tr>

         ))}

       </tbody>

     </table>

   </div>

 );

}