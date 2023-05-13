import { useState, useEffect, useLayoutEffect } from "react";

export default function useToggleTheme() {
    const [isDark, setDark] = useState<boolean>(false);
    useEffect(()=>{
        if (isDark){
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    },[isDark])


    return {
        isDark,
        setDark
      };
}