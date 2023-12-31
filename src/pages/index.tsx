import { BASE_API_V1 } from "@/constant/Constant";
import { Combobox, Listbox, Transition } from "@headlessui/react";
import fetch from "node-fetch";
import { Fragment, useEffect, useState } from "react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import * as crypto from "crypto";

//PPP
// const clientID = 'P8mpRafQT0iP0ikqVDlS0g';
// const secretKey = 'GQOmRwmGjuAfAeAGXP6Otg==';
// const signatureKey = 'OZEQUZLB+1ZqXTQIhTbaxdjlzF99hfkvlMaXegE/X+Y=';

//DBB
// const clientID = 'kUPS4KZ0Rs0NE0bFuyO7DQ';
// const secretKey = 'KY+rNeyULigWP6GdBpPEfA==';
// const signatureKey = 'euSY6FdhBYpG2PRa3gi6wtBWq/Ez5eij8yO389Dd74w=';

// testclient1
const clientID = "cScN6UqYRZKRnX2aG5WSEA";
const secretKey = "19FP+vqZfiBhdtQfS2uALw==";
const signatureKey = "3wJjZwA7c2AkMpNuuirvpIsxImBaDDACyizbzL5YtZY=";

//PROD
// const secretKey = 'cOSlzb+GEF/gNct/v7UGSQ==';
// const signatureKey = '6MHA4SV5TNnQh8NiZclzzT9iiAIGdrzoshFDlkbxIM0=';

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState("");
  const [methodData, setMethodData] = useState([]);
  const [methodPayment, setMethodPayment] = useState({
    name: "",
    code: "",
    type: "",
  });
  const [cyrptoId, setCryptoId] = useState<any>();
  const [isData, setIsData] = useState(false);
  const [isCrypto, setIsCrypto] = useState(false);
  const [expired, setExpired] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const listCrypto = [
    {
      name: "USDT",
      id: "d3bfeef9-b974-465e-a05f-81ec98acc91b",
    },
    {
      name: "TRON",
      id: "2a9c199e-14b8-4dbb-9550-1fbaef8b8004",
    },
    {
      name: "MATIC",
      id: "400f05b6-376f-44eb-9e65-00fe7bb05be0",
    },
    {
      name: "LTC",
      id: "b03e4a5e-76a9-48d8-8ec8-deaab82d69cc",
    },
    {
      name: "ETH",
      id: "bcf02326-cd4c-4df2-9485-a66c8d0db49d",
    },
    {
      name: "BSC",
      id: "bf14b753-ca43-40a6-8e81-dd1aa094948d",
    },
    {
      name: "BTC",
      id: "9b6f7041-78ee-4f7b-9777-a2bb54015cba",
    },
  ];

  const reqApi = async (method: string, url: string, body?: string, sig?: string, endpoint?: string, timestamp?: number) => {
    const headers: any = {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    };

    if (sig) {
      headers["X-SIGNATURE"] = sig;
    }
    if (method) {
      headers["X-METHOD"] = method;
    }
    if (timestamp) {
      headers["X-TIMESTAMP"] = timestamp;
    }
    if (endpoint) {
      headers["X-URL"] = endpoint;
    }
    const response = await (method === "GET" ? fetch(url, { headers }) : fetch(url, { method, headers, body }));
    return await response.json();
  };

  const getSignature = async (url: string, payload: {}, timestamp: number) => {
    const res = await reqApi("POST", `${BASE_API_V1}signature`, JSON.stringify(payload), "", url, timestamp);
    return res.data.signature;
  };

  const getMethod = async () => {
    console.log(method);
    const result = await reqApi("GET", method === "topup" || method === "payment" ? `${BASE_API_V1}utility/method` : `${BASE_API_V1}utility/bank`);

    setMethodData(
      result.data.map((data: any) => {
        return {
          name: data.name,
          code: data.code,
          type: data.type,
        };
      })
    );
  };

  const addPayment = async () => {
    const today = new Date();
    const exp = new Date();
    exp.setDate(exp.getDate() + 1);
    let endpoint;
    let body: any;
    if (method === "payment") {
      endpoint = `generate/${methodPayment.type}`;
      body = {
        expired: exp.getTime(),
        amount: Number(amount),
        transactionRef: `${today.getTime()}`,
        customerName: `Test_Payment_${today.getTime()}`,
        method: `${methodPayment.code}`,
        phone: phone,
      };
    } else if (method === "topup") {
      endpoint = `topup/${methodPayment.type}`;
      body = {
        expired: exp.getTime(),
        amount: Number(amount),
        transactionRef: `${today.getTime()}`,
        customerName: `Test_Payment_${today.getTime()}`,
        method: `${methodPayment.code}`,
      };
    } else if (method === "transfer") {
      endpoint = `transfer/${methodPayment.type}/inquiry`;
      body = {
        amount: Number(amount),
        transferRef: `'${today.getTime()}'`,
        channelCode: `${methodPayment.code}`,
        accountNumber: accountNumber,
      };
    } else {
      endpoint = "crypto/generate";
      body = {
        amount: Number(amount),
        transactionRef: `${today.getTime()}`,
        cryptoId: cyrptoId.id,
      };
    }
    const url = `${BASE_API_V1}${endpoint}`;

    const sig = await getSignature(`/${endpoint}`, body, today.getTime());

    if (sig) {
      const xSig = crypto.createHmac("sha512", signatureKey).update(`${sig}|${clientID}`).digest("hex");

      const result = await reqApi("POST", url, JSON.stringify(body), xSig, "", today.getTime());

      if (method === "transfer") {
        endpoint = `transfer/${methodPayment.type}/payment`;
        const urlPayment = `${BASE_API_V1}${endpoint}`;
        body.paymentRef = result.data.ref2;
        const sigPayment = await getSignature(`/${endpoint}`, body, today.getTime());

        if (sigPayment) {
          const xSigPayment = crypto.createHmac("sha512", signatureKey).update(`${sigPayment}|${clientID}|${result.data.signature}`).digest("hex");

          const resultPayment = await reqApi("POST", urlPayment, JSON.stringify(body), xSigPayment, "", today.getTime());
        }
      } else {
        setResult(result.data.va || result.data.qris || result.data.deeplink);
      }
    }
  };

  useEffect(() => {
    if (methodPayment.name) {
      setIsData(true);
      setResult(null);
    } else if (method === "crypto") {
      setMethodData([]);
      setIsData(true);
      setIsCrypto(true);
    }
  }, [methodPayment, method]);

  useEffect(() => {
    setUsername(clientID);
    setPassword(secretKey);
  }, []);

  return (
    <div className="w-full h-full p-4">
      <h1>Niagapay Simulator</h1>
      <div className=" gap-3 grid grid-cols-1">
        <div className="flex flex-row items-center space-x-3">
          <input type="radio" name="method" id="" value="payment" onChange={(e) => setMethod(e.target.value)} /> Payment
          <input type="radio" name="method" id="" value="transfer" onChange={(e) => setMethod(e.target.value)} /> Transfer
          <input type="radio" name="method" id="" value="topup" onChange={(e) => setMethod(e.target.value)} /> Topup
          <input type="radio" name="method" id="" value="crypto" onChange={(e) => setMethod(e.target.value)} /> Crypto
        </div>
        <input className="border p-4 rounded-md" type="text" value={username} placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-4 rounded-md" type="text" value={password} placeholder="password" onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-black p-4 rounded-md text-white mb-4" onClick={getMethod}>
          Authenticate
        </button>
      </div>

      <div className="w-full">
        <>
          {methodData.length > 1 && (
            <Listbox value={methodPayment ?? ""} onChange={setMethodPayment}>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full border cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                  <span className="block truncate">{methodPayment.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {methodData.map((method: any, methodIdx) => (
                      <Listbox.Option key={methodIdx} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-amber-100 text-amber-900" : "text-gray-900"}`} value={method ?? ""}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{`${method.name}`}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          )}
        </>
        <>
          <>
            <Listbox value={cyrptoId ?? ""} onChange={setCryptoId}>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full border cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                  <span className="block truncate">{methodPayment.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {listCrypto.map((method: any, methodIdx) => (
                      <Listbox.Option key={methodIdx} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-amber-100 text-amber-900" : "text-gray-900"}`} value={method ?? ""}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{`${method.name}`}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </>
        </>
      </div>

      {isData && (
        <div className="grid grid-cols-1 gap-3 mt-4">
          <input className="border p-4 rounded-md" type="number" value={amount ?? ""} placeholder="amount" onChange={(e) => setAmount(e.target.value)} />

          {result && <div>{result}</div>}

          {methodPayment.type === "ewallet" && <input className="border p-4 rounded-md" type="text" value={phone ?? ""} placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />}

          {method === "transfer" && <input className="border p-4 rounded-md" type="text" value={accountNumber ?? ""} placeholder="Account Number" onChange={(e) => setAccountNumber(e.target.value)} />}

          <button onClick={addPayment}>{`Add ${method}`}</button>
        </div>
      )}
    </div>
  );
}
