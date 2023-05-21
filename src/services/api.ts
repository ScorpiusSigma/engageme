

const base_url = process.env.NEXT_PUBLIC_API_BASE_URL || ""

const non_versioned_api: string[] = []// ["signin", "users"]

const is_versioned_api = (relative_url: string) => {
    for (let i = 0; i < non_versioned_api.length; i++) {
        if (relative_url.includes(non_versioned_api[i])) {
            return false;
        }
    }
    return true;
}

const createFormData = (data: any[]) =>{
    const formData = new FormData
    for(const name in data){
        formData.append(name, data[name])
    }
    return formData
}

// https://itnext.io/error-handling-with-async-await-in-js-26c3f20bc06a
const get = async (relative_url: string) => {
    let final_url = form_url(relative_url)
    try {
        let res = await fetch(final_url, {
            method: 'GET',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                //Authorization: `Bearer ${process.env.REACT_APP_JWT}`,
            }
        })
        return res//.json()
    } catch (e) {
        console.error(`${relative_url} error! ${e}`)
        throw e;
    } finally {
        // console.log('We do cleanup here');
    }

}

const put = async (relative_url: string, body: any) => {

    let final_url = form_url(relative_url)
    let res = await fetch(final_url, {
        method: 'PUT',
        credentials: "include",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    return res//.json()
}

const post = async (relative_url: string, body: any, isFormData: boolean = false) => {

    let final_url = form_url(relative_url)
    let payload = isFormData?createFormData(body):JSON.stringify(body)
    // console.log("payload")
    // console.log(payload)
    try {
        let res = isFormData?await fetch(final_url, {
            method: 'POST',
            credentials: "include",
            body: payload,
        }):await fetch(final_url, {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: payload,
        })
        console.log(res)
        return res
    } catch (e) {
        console.error(`${relative_url} error! ${e}`)
        throw e;
    } finally {
        // console.log('We do cleanup here');
    }
}

const post_external = async (url: string, body: any, header: any) => {
    let res = await fetch(url, {
        method: 'POST',
        credentials: "include",
        headers: header,
        body: JSON.stringify(body),
    })

    return res//.json()
}

const form_url = (relative_url: string) => {
    let final_url = base_url
    // console.log(final_url)
    if (is_versioned_api(relative_url)) {
        final_url += `/${process.env.NEXT_PUBLIC_API_VERSION}`
        // console.log(final_url)
    }
    final_url += relative_url; //has the slash infront
    // console.log(`final_url: ${final_url}`)
    return final_url
}

export { get, post, put, post_external }