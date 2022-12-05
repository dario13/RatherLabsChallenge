import axios from 'axios'

export const makeQueryGraphQl = async (query: string, url: string, variables?: any) => {
  const headers = {
    'content-type': 'application/json',
    'accept-encoding': '*',
  }
  const graphQlQuery = {
    query: query,
    variables: variables,
  }
  let response: any = {}
  try {
    response = await axios({
      url: url,
      method: 'post',
      headers: headers,
      data: graphQlQuery,
    })
  } catch (error) {
    console.log('error: ', error)
  }
  return response
}
