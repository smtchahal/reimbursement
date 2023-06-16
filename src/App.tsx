import React, { useRef, useState } from 'react';
import moment from 'moment';
import './styles.css';

type Data = {
  id: string;
  type: string;
  date: string;
  amount: number;
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

const groupBy = <T,>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => string,
) =>
  array.reduce((acc, value, index, array) => {
    (acc[predicate(value, index, array)] ||= []).push(value);
    return acc;
  }, {} as { [key: string]: T[] });

const sortByKey = <T,>(unordered: Record<string, T>) =>
  Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {} as Record<string, T>);

const pluralize = (count: number, noun: string, suffix = 's') =>
  `${count} ${noun}${count !== 1 ? suffix : ''}`;

const formatNumber = (n: number) => Intl.NumberFormat('en-IN').format(n);

const defaultAmount = 600;

const genId = () => (Math.random() + 1).toString(36).substring(2);

export default function App() {
  const [data, setData] = useState<Data[]>([]);
  const [date, setDate] = useState('');
  const [type, setType] = useState('court');
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const templateRef = useRef(null);

  // useEffect(() => {
  //   const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  //     event.preventDefault();
  //     return (event.returnValue = '');
  //   };
  //   if (data.length > 0) {
  //     window.addEventListener('beforeunload', handleBeforeUnload);
  //   } else {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   }
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, [data]);

  const addDatum = () => {
    if (!date || !amount || !qty) {
      alert('Missing fields');
      return;
    }
    setData(d => [
      ...d,
      ...Array(qty)
        .fill(1)
        .map(() => ({ id: genId(), type, date, amount })),
    ]);
    setDate('');
    setAmount(defaultAmount);
    setQty(1);
  };

  console.log(groupBy(data, d => d.date));

  return (
    <div className="App">
      <h2>Enter some data.</h2>
      <table id="data">
        <tbody>
          {data.map(({ id, date, type, amount }) => (
            <tr key={id}>
              <td>{date}</td>
              <td>{type}</td>
              <td>₹{amount}</td>
              <td>
                <button
                  type="button"
                  className="delete"
                  onClick={() => {
                    setData(d => d.filter(it => it.id !== id));
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <input
          type="number"
          min="1"
          placeholder="quantity"
          value={qty}
          onChange={e => setQty(parseInt(e.target.value))}
          style={{ width: 32 }}
        />
        <input
          type="text"
          value={type}
          placeholder="Type"
          onChange={e => setType(e.target.value)}
        />
        <input
          type="date"
          value={date}
          placeholder="Date"
          onChange={e => setDate(e.target.value)}
        />
        <input
          type="number"
          min={1}
          value={typeof amount === 'number' ? amount : ''}
          placeholder="Amount"
          onChange={e => setAmount(parseInt(e.target.value, 10))}
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
          onClickCapture={() =>
            selectElementContents(templateRef.current as unknown as HTMLElement)
          }
        >
          <br />
          <br />
          Please find attached the receipts of the following:
          <br />
          <ol>
            {Object.entries(sortByKey(groupBy(data, d => d.date))).map(
              ([date, datums]) => (
                <li key={date}>
                  {moment(date).format('DD MMM')} -{' '}
                  {datums.length > 0 && (
                    <>
                      {Object.entries(groupBy(datums, d => d.type)).map(
                        ([type, typeData], index) => (
                          <React.Fragment key={index}>
                            {index > 0 && ', '}
                            {pluralize(typeData.length, type)}
                            {type === 'court' && ' booked'} (₹
                            {formatNumber(
                              typeData.reduce(
                                (acc, iter) => acc + iter.amount,
                                0,
                              ),
                            )}
                            )
                          </React.Fragment>
                        ),
                      )}{' '}
                      {new Set(datums.map(d => d.type)).size > 1 && (
                        <>
                          (Total: ₹
                          {formatNumber(
                            datums.reduce((acc, iter) => acc + iter.amount, 0),
                          )}
                          )
                        </>
                      )}
                    </>
                  )}{' '}
                </li>
              ),
            )}
          </ol>
          Total:{' '}
          <b>
            ₹
            {formatNumber(
              data.map(_d => _d.amount).reduce((acc, iter) => acc + iter, 0),
            )}
            /-
          </b>
          <br />
          <br />
        </div>
      ) : null}
    </div>
  );
}
