import React,{createContext,useContext,useState} from 'react';
type Ctx={active:boolean;activate:()=>void};
const SubscriptionContext=createContext<Ctx|null>(null);
export function SubscriptionProvider({children}:{children:React.ReactNode}){const [active,setActive]=useState(false);return <SubscriptionContext.Provider value={{active,activate:()=>setActive(true)}}>{children}</SubscriptionContext.Provider>}
export function useSubscription(){const v=useContext(SubscriptionContext);if(!v)throw new Error('useSubscription must be inside SubscriptionProvider');return v;}
