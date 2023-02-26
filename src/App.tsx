import { useEffect, useRef, useState } from "react";
import moment from "moment";
import "./styles.css";

type Data = {
  id: string;
  date: string;
  amount?: number;
};

function selectElementContents(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

const groupBy = (xs: Record<string, any>, key: string) =>
  xs.reduce((rv: any[], x: any) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

const defaultAmount = 600;

const genId = () => (Math.random() + 1).toString(36).substring(2);

export default function App() {
  const [data, setData] = useState<Data[]>([]);
  const [date, setDate] = useState("");
  const [type, setType] = useState("court");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState<number | undefined>(defaultAmount);
  const templateRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSender(params.get("sender") || "");
    setReceiver(params.get("receiver") || "");
  }, []);

  const addDatum = () => {
    if (!date || !amount) {
      alert("Missing fields");
      return;
    }
    setData((d) => [...d, { id: genId(), type, date, amount }]);
    setDate("");
    setAmount(defaultAmount);
  };

  console.log(groupBy(data, "date"));

  return (
    <div className="App">
      <h1>Sender: {sender}</h1>
      <h1>Receiver: {receiver}</h1>
      <h2>Enter some data.</h2>
      <table id="data">
        {data.map(({ id, date, amount }) => (
          <tr key={id}>
            <td>{date}</td>
            <td>₹{amount}</td>
            <td>
              <button
                type="button"
                className="delete"
                onClick={() => {
                  setData((d) => d.filter((it) => it.id !== id));
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </table>
      <div>
        <input
          type="text"
          value={type}
          placeholder="Type"
          onChange={(e) => setType(e.target.value)}
        />
        <input
          type="date"
          value={date}
          placeholder="Date"
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="number"
          min={1}
          value={typeof amount === "number" ? amount : ""}
          placeholder="Amount"
          onChange={(e) => setAmount(parseInt(e.target.value, 10))}
        />
        <button type="button" onClick={addDatum}>
          + Add data
        </button>
      </div>
      {/* <pre style={{ textAlign: "left" }}>{JSON.stringify(data, null, 2)}</pre> */}
      {data.length > 0 ? (
        <div
          ref={templateRef}
          id="template"
          onClickCapture={(e) =>
            selectElementContents(
              (templateRef.current as unknown) as HTMLElement
            )
          }
        >
          Hi {receiver},
          <br />
          <br />
          Please find attached the receipts of the following:
          <br />
          <ol>
            {Object.entries(groupBy(data, "date")).map(([date, datums]) => (
              <li key={date}>
                {moment(date).format("DD MMM")} -{" "}
                {datums.filter((d) => d.type === "court").length} court
                {datums.filter((d) => d.type === "court").length === 1
                  ? ""
                  : "s"}{" "}
                booked (₹
                {datums
                  .filter((d) => d.type === "court")
                  .map((_d) => _d.amount)
                  .reduce((acc, iter) => acc + iter, 0)}
                )
                {datums.filter((d) => d.type !== "court").length > 0 ? (
                  <>
                    {", "}
                    {datums
                      .filter((d) => d.type !== "court")
                      .map((d) => `${d.type} (₹${d.amount})`)
                      .join(", ")}{" "}
                    (Total: ₹
                    {datums
                      .map((_d) => _d.amount)
                      .reduce((acc, iter) => acc + iter, 0)}
                    )
                  </>
                ) : (
                  ""
                )}{" "}
              </li>
            ))}
          </ol>
          Total:{" "}
          <b>
            ₹{data.map((_d) => _d.amount).reduce((acc, iter) => acc + iter, 0)}
            /-
          </b>
          <br />
          <br />
          Thanks,
          <br />
          {sender}
        </div>
      ) : null}
    </div>
  );
}
