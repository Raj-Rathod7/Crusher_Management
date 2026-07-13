import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field, FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: ""
  })

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log(loginInfo.username, loginInfo.password);
    const response = await fetch("http://localhost:8081/auth/login",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: loginInfo.username,
        password: loginInfo.password
      })
    })

    const data = await response.json();
    console.log(data);
  }
  
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your username below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username" >Username</FieldLabel>
          <Input id="username" type="text" value={loginInfo.username} onChange={(e) => setLoginInfo({...loginInfo, username: e.target.value})} placeholder="Enter your username" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input id="password" type="password" value={loginInfo.password} onChange={(e) => setLoginInfo({...loginInfo, password: e.target.value})} required />
        </Field>
        <Field>
          <Button type="submit">Login</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
