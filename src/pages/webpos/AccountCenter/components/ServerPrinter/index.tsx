import React, { useEffect, useState } from 'react';
import { connect } from 'umi';
import PrinterBody from './PrintReceipt'
import html2canvas from 'html2canvas';
import { message, Modal } from 'antd';

const ReceiptServerPrinter = ({
  dispatch,
  record = {},
  id,
  token,
  openBrowerPrinter,
  setAllInformation,
  oneBranchInfoPre,
}) => {

  const [currentInvoice, setCurrentInvoice] = useState({})
  // const [oneBranchInfo, setOneBranchInfo] = useState({})
  // const [currentOrderDetail, setCurrentOrder] = useState({})
  const [visible, setVisible] = useState(false)
  const [isDataLoaded, setIsLoaded] = useState(false)
  const [isSuccess, setIsSuccess] = useState(true)

  console.log('ReceiptServerPrinter,id', id);

  const times = localStorage.getItem('PRINTER_TIMES')

  useEffect(() => {
    const branchId = record.branchId
    const orderId = record.orderId
    const invoiceId = record.invoiceId
    
    console.log('useEffect815,record110', record);
    console.log('useEffect815,branchId', branchId);
    console.log('useEffect815,orderId', orderId);
    console.log('useEffect815,invoiceId', invoiceId);

    if (branchId && orderId && invoiceId) {
      setVisible(true)

      dispatch({
        type: 'receiptPrinting/fetchOneInvoice',
        payload: {
          invoiceId: invoiceId,
          orderId: orderId,
          branchId: branchId,
          token: token,
        },
        callback: (res) => {
          console.log('fetchOneInvoic,res', res);
          setCurrentInvoice(res)
        },
      });
    }
  }, [record])

  const [counter, setCounter] = useState(0)

  useEffect(() => {
    console.log('useEffect1665165,currentInvoice', currentInvoice);
    console.log('useEffect1665165,oneBranchInfoPre', oneBranchInfoPre);
    // console.log('useEffect1665165,currentOrderDetail', currentOrderDetail);

    if (oneBranchInfoPre.id && currentInvoice.id && currentInvoice.order) {
      setIsLoaded(true)

      var root = document.getElementById('PrintPOSReceiptServer')
      var pri = document.getElementById("idPrinterContent").contentWindow;

      setAllInformation({
        oneBranchInfo: oneBranchInfoPre,
        currentOrder: currentInvoice.order,
        currentInvoice: currentInvoice,
      })

      const localStorageValue = localStorage.getItem(IS_PRINTER_APPLIED)
      const isPrinterApplied = localStorageValue ? localStorageValue === 'YES' : true

      if (isPrinterApplied) {
        setCounter(counter + 1)
        console.log('counter1987', counter);
        
        if(counter === 0){
          setTimeout(() => {
            for( var i =0; i < parseInt(times) ; i++){
              sendDataToPrinter(root, pri)
            }
          }, 500)
        }
      } else {
        setVisible(false)

        setTimeout(() => {
          openBrowerPrinter()
          resetAllInformation()
        }, 300)
      }
    }
  }, [currentInvoice])


  const PRINTER_PORTR = 'PRINTER_PORTR'
  const PRINTER_ADDRESS = 'PRINTER_ADDRESS'
  const IS_PRINTER_APPLIED = 'IS_PRINTER_APPLIED'

  // 发送数据到打印机
  const sendDataToPrinter = (root, pri) => {

    console.log('sendDataToPrinter198,root', root);
    console.log('sendDataToPrinter198,pri', pri);

    html2canvas(root, {
      scale: 3.5,
      logging: false,
      width: 330,
      // useCORS: true, // Whether to attempt to load images from a server using CORS
    }).then(function (canvas) {
      var myImage = canvas.toDataURL("image/jpeg");
      console.log('sendDataToPrinter,myImage', myImage);

      const formData = new FormData();
      formData.append('file', myImage);
      console.log('sendDataToPrinter,formData', formData);

      const address = localStorage.getItem(PRINTER_ADDRESS) || 'localhost'
      const port = localStorage.getItem(PRINTER_PORTR) || '5000'

      fetch(`http://${address}:${port}/print/64code`, {
        method: 'POST',
        body: formData
      }).then((res) => {
        console.log('sendDataToPrinter,res', res);

        // 如果没有成功，则用之前的方式
        if (res && res.status == 200) {
          setVisible(false)
          resetAllInformation()
        } else {
          openBrowerPrinter()
          setIsSuccess(false)
        }
      }).catch(() => {
        openBrowerPrinter()
        setIsSuccess(false)
      });
    });
  }

  const resetAllInformation = () => {
    setCurrentInvoice({})
    // setCurrentOrder({})

    setIsLoaded(false)
    setIsSuccess(true)

    setCounter(0)
  }

  const isPrinterApplied = localStorage.getItem(IS_PRINTER_APPLIED) === 'YES'

  return (
    <>
      <PrinterBody
        currentInvoice={currentInvoice}
        oneBranchInfo={oneBranchInfoPre}
        currentOrderDetail={currentInvoice.order || {}}
      />
      
      <Modal
        width={300}
        closeIcon={null}
        onCancel={() => {
          resetAllInformation()
          setVisible(false)
        }}
        destroyOnClose={true}
        visible={visible || false}
        footer={false}
      >
        {isPrinterApplied && isSuccess && !isDataLoaded && <div>Request data...</div>}
        {isPrinterApplied && isSuccess && isDataLoaded && <div>Printing...</div>}
        {isPrinterApplied && !isSuccess && <div>Please check you connection. Or start your local printer server.</div>}
      
        {!isPrinterApplied && <div>Request data...</div>}
      </Modal>
    </>
  );
}


export default connect(
  ({
    receiptPrinting: { allReceiptInfo },
    InvoicesFinishedData,
  }: {
    receiptPrinting: any;
    InvoicesFinishedData: any;
  }) => ({
    InvoicesFinishedData,
    allReceiptInfo,
  }),
)(ReceiptServerPrinter);
