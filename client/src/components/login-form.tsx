import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field, FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { login } from "#/lib/mutation"
import type { AuthResponse } from "#/lib/models"
import { Loader } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: ""
  })

  const { mutate, isPending, error } = useMutation<AuthResponse, Error, {username: string, password: string}>({
    mutationFn: ({username, password}) => login(username, password),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.log(error);
    }
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(loginInfo.username && loginInfo.password){
      mutate({username: loginInfo.username, password: loginInfo.password});
    }
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
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader className="animate-spin" />} {isPending ? "Logging in..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
