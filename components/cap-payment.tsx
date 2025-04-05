import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 合约地址和模块名称
const CONTRACT_ADDRESS = "0x69501c9f7bfbfd62dded3e8f9b63a348b90ba60fd6ee0feacd95e753f5a487e4";
const MODULE_NAME = "cap_token";

// 缩短地址显示
const shortenAddress = (address: string | null) => {
  if (!address) return 'Not connected';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface CapPaymentProps {
  account: string | null;
  onPaymentComplete: () => void;
  onPaymentError: (error: string) => void;
}

// 获取代币余额
const getTokenBalance = async (address: string) => {
  try {
    const response = await fetch(
      `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resource/0x1::coin::CoinStore<${CONTRACT_ADDRESS}::${MODULE_NAME}::CAP>`
    );
    if (response.status === 404) {
      return "0";
    }
    const data = await response.json();
    return data.data.coin.value;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return "0";
  }
};

// 检查代币注册状态
const checkTokenRegistration = async (address: string) => {
  try {
    const response = await fetch(
      `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resources`
    );
    const resources = await response.json();
    return resources.some((resource: any) => 
      resource.type === `0x1::coin::CoinStore<${CONTRACT_ADDRESS}::${MODULE_NAME}::CAP>`
    );
  } catch (error) {
    console.error('Error checking token registration:', error);
    return false;
  }
};

export const CapPayment: React.FC<CapPaymentProps> = ({ account, onPaymentComplete, onPaymentError }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('10'); // 默认支付 10 CAP
  const [balance, setBalance] = useState("0");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoComplete, setAutoComplete] = useState(false); // 添加自动完成选项
  const [activeTab, setActiveTab] = useState("payment"); // 添加标签页状态
  const [transactionHash, setTransactionHash] = useState<string | null>(null); // 添加交易哈希状态

  // 检查代币注册状态
  useEffect(() => {
    const checkRegistration = async () => {
      if (account) {
        const registered = await checkTokenRegistration(account);
        setIsRegistered(registered);
      }
    };
    
    checkRegistration();
  }, [account]);

  // 定时刷新余额
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const updateBalance = async () => {
      if (account) {
        const newBalance = await getTokenBalance(account);
        setBalance(newBalance);
      }
    };

    if (account) {
      updateBalance(); // 立即执行一次
      intervalId = setInterval(updateBalance, 5000); // 每5秒更新一次
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [account]);

  // 自动完成支付（用于测试）
  useEffect(() => {
    if (autoComplete && account && isRegistered) {
      // 模拟支付过程
      const timer = setTimeout(() => {
        toast.success('Auto payment completed');
        onPaymentComplete();
        setActiveTab("create"); // 切换到创建房间标签
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoComplete, account, isRegistered, onPaymentComplete]);

  // 注册代币函数
  const handleRegister = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 先检查是否已注册
      const registered = await checkTokenRegistration(account);
      if (registered) {
        setIsRegistered(true);
        toast.success('Your wallet has already registered CAP token');
        return;
      }

      // 如果未注册，则调用注册函数
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::register`,
        type_arguments: [],
        arguments: []
      };

      // 这里需要调用 Aptos 钱包的 signAndSubmitTransaction 方法
      // 由于我们没有直接访问钱包的权限，我们需要通过 API 调用
      const response = await fetch('/api/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account,
          payload
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register token');
      }

      const data = await response.json();
      console.log('Registration submitted:', data);
      
      if (data.hash) {
        setTransactionHash(data.hash);
        toast.success(`Token registration transaction submitted! Hash: ${data.hash}`);
      } else {
        toast.success('Token registration transaction submitted!');
      }
      
      setIsRegistered(true);
    } catch (error) {
      console.error('Registration Error:', error);
      toast.error('Token registration failed: ' + (error as Error).message);
      onPaymentError((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      toast.error('Please enter recipient address and amount');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 先检查接收方是否注册了代币
      const isRecipientRegistered = await checkTokenRegistration(recipient);
      if (!isRecipientRegistered) {
        toast.error('Recipient address needs to register CAP token first. Please contact the recipient to register the token, or use an admin wallet for transfer.');
        return;
      }

      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::transfer`,
        type_arguments: [],
        arguments: [recipient, amount]
      };

      // 这里需要调用 Aptos 钱包的 signAndSubmitTransaction 方法
      // 由于我们没有直接访问钱包的权限，我们需要通过 API 调用
      const response = await fetch('/api/transfer-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account,
          payload
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transfer token');
      }

      const data = await response.json();
      console.log('Transaction submitted:', data);
      
      if (data.hash) {
        setTransactionHash(data.hash);
        toast.success(`Transfer transaction submitted! Hash: ${data.hash}`);
      } else {
        toast.success('Transfer transaction submitted!');
      }
      
      // 清空输入
      setRecipient('');
      setAmount('10');
      
      // 通知支付完成
      onPaymentComplete();
      
      // 切换到创建房间标签
      setActiveTab("create");
    } catch (error) {
      // 详细打印错误信息
      console.error('Transfer Error:', {
        error,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        recipient,
        amount,
        contractAddress: CONTRACT_ADDRESS,
        moduleName: MODULE_NAME
      });

      const errorMessage = (error as Error).message;
      if (errorMessage.includes("Account hasn't registered")) {
        toast.error('Recipient address needs to register CAP token first. Please contact the recipient to register the token, or use an admin wallet for transfer.');
      } else {
        toast.error('Transfer failed: ' + errorMessage);
      }
      
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardHeader className="bg-amber-100">
        <CardTitle>CAP Token Payment</CardTitle>
        <CardDescription>Pay CAP tokens to create a room</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-amber-100 rounded-lg">
          <p className="text-sm font-medium">Current wallet address: {shortenAddress(account)}</p>
          <p className="text-sm font-medium">CAP Token balance: {balance}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-amber-200">
            <TabsTrigger value="payment" className="data-[state=active]:bg-amber-400">CAP Payment</TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-amber-400">Create Room</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment">
            {!isRegistered ? (
              <Button 
                onClick={handleRegister}
                disabled={isProcessing || !account}
                className="w-full mb-4 bg-amber-600 hover:bg-amber-700"
              >
                {isProcessing ? 'Registering...' : 'Register CAP Token'}
              </Button>
            ) : (
              <>
                <div className="mb-4">
                  <Input
                    placeholder="Recipient address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="mb-2 border-amber-300 focus:border-amber-500"
                  />
                  <Input
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => {
                      // 只允许输入数字
                      if (/^\d*$/.test(e.target.value)) {
                        setAmount(e.target.value);
                      }
                    }}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <Button 
                  onClick={handleTransfer}
                  disabled={isProcessing || !account || !recipient || !amount}
                  className="w-full mb-4 bg-amber-600 hover:bg-amber-700"
                >
                  {isProcessing ? 'Processing...' : 'Pay CAP Tokens'}
                </Button>
                
                {/* 添加自动完成选项（仅用于测试） */}
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="auto-complete" 
                    checked={autoComplete}
                    onCheckedChange={(checked) => setAutoComplete(checked as boolean)}
                    className="border-amber-500 data-[state=checked]:bg-amber-600"
                  />
                  <label 
                    htmlFor="auto-complete" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto-complete payment (for testing)
                  </label>
                </div>
              </>
            )}
            
            {transactionHash && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
                <p className="text-sm font-medium">Transaction Hash:</p>
                <p className="text-xs font-mono break-all">{transactionHash}</p>
                <p className="text-sm mt-2">You can now create a room!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="p-4 bg-amber-100 rounded-lg mb-4">
              <p className="text-sm font-medium">Payment completed successfully!</p>
              <p className="text-sm mt-1">You can now create a room.</p>
            </div>
            
            <Button 
              onClick={() => onPaymentComplete()}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Create New Room
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 