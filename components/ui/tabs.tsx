import * as React from "react"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, children, defaultValue, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || '')
  
  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ activeTab?: string; setActiveTab?: (value: string) => void }>, { activeTab, setActiveTab })
        }
        return child
      })}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { activeTab?: string; setActiveTab?: (value: string) => void }
>(({ className, children, activeTab, setActiveTab, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${className || ''}`}
    {...props}
  >
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<{ activeTab?: string; setActiveTab?: (value: string) => void }>, { activeTab, setActiveTab })
      }
      return child
    })}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    value: string; 
    activeTab?: string; 
    setActiveTab?: (value: string) => void 
  }
>(({ className, value, activeTab, setActiveTab, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value 
        ? 'bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50' 
        : ''
    } ${className || ''}`}
    onClick={() => setActiveTab?.(value)}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    value: string; 
    activeTab?: string 
  }
>(({ className, value, activeTab, ...props }, ref) => {
  if (activeTab !== value) return null
  
  return (
    <div
      ref={ref}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 ${className || ''}`}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }