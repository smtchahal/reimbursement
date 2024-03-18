import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import './styles.scss';
import { Data } from './types';
import {
  formatNumber,
  groupBy,
  pluralize,
  selectElementContents,
  sortByKey,
  useSessionStorage,
} from './helpers';

const defaultAmount = 600;

const genId = () => (Math.random() + 1).toString(36).substring(2);

export default function App() {
  const [data, setData] = useState<Data[]>([]);
  const [date, setDate] = useState('');
  const [type, setType] = useState('court');
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState<number | ''>(defaultAmount);
  const templateRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useSessionStorage(
    'isDarkMode',
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    if (data.length > 0) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data]);

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
    // setDate('');
    // setAmount(defaultAmount);
    // setQty(1);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // only allow numerals and decimals
    const amountText = e.target.value.replace(/[^0-9.]/g, '');

    // only allow 2 decimals
    const [, decimals] = amountText.split('.');
    if (decimals && decimals.length > 2) {
      return;
    }

    const amount = parseFloat(amountText);
    if (!isNaN(amount)) {
      setAmount(amount);
    } else {
      setAmount('');
    }
  };

  console.log(groupBy(data, d => d.date));

  const allData = useMemo(
    () => Object.entries(sortByKey(groupBy(data, d => d.date))),
    [data],
  );

  return (
    <div className={isDarkMode ? 'App dark' : 'App'}>
      <button
        className={isDarkMode ? 'theme-toggle dark' : 'theme-toggle'}
        type="button"
        onClick={() => {
          setIsDarkMode(d => !d);
        }}
      >
        {isDarkMode ? '🌞' : '🌜'}
      </button>
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
          value={amount}
          placeholder="Amount"
          onChange={handleAmountChange}
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
            {allData.map(([date, datums]) => {
              const entries = Object.entries(groupBy(datums, d => d.type));
              return (
                <li key={date}>
                  {moment(date).format('DD MMM')}
                  {entries.length === 1 && ' - '}
                  {datums.length > 0 && (
                    <>
                      {entries.length === 1 ? (
                        <>
                          {pluralize(datums.length, datums[0].type)} (
                          {datums.length > 1 && (
                            <>
                              ₹{formatNumber(datums[0].amount)} x{' '}
                              {datums.length} ={' '}
                            </>
                          )}
                          ₹
                          {formatNumber(
                            datums.reduce((acc, iter) => acc + iter.amount, 0),
                          )}
                          )
                        </>
                      ) : (
                        <ul>
                          {entries.map(([type, typeData], index) => (
                            <li key={index}>
                              {pluralize(typeData.length, type)} (
                              {typeData.length > 1 ? (
                                <>
                                  ₹{formatNumber(typeData[0].amount)} x{' '}
                                  {typeData.length} = ₹
                                  {formatNumber(
                                    typeData.reduce(
                                      (acc, iter) => acc + iter.amount,
                                      0,
                                    ),
                                  )}
                                </>
                              ) : (
                                <>₹{formatNumber(typeData[0].amount)}</>
                              )}
                              )
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}{' '}
                </li>
              );
            })}
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
