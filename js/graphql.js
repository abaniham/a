// GraphQL client

// GraphQL API
const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

export async function graphqlRequest(query, variables = {}) {
  const token = localStorage.getItem("jwt");

  // if there is no token in localStorage --> error
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Make sure the token is in the format --> header.payload.signature
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    localStorage.removeItem('jwt');
    throw new Error('Invalid token format');
  }

  try {
    const res = await fetch(GRAPHQL_URL, { // link of servar
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status}`);
    }

    const response = await res.json();

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    return response.data;
  } catch (error) {
    console.error("GraphQL Error:", error);
    throw error;
  }
}

// get user data
export async function getUser() {
  const query = `
    {
      user {
        id
        login
        firstName
        lastName
        email
        profile
      }
    }
  `;

  return graphqlRequest(query);
}

// get xp
export async function getUserXP() {
  const userInfo = await getUser();
  const userId = userInfo.user[0].id;

  const query = `
    query {
      transaction(
        where: {
          userId: {_eq: "${userId}"}, 
          type: {_eq: "xp"}, 
          object: {type: {_neq: "exercise"}}
        }, 
        order_by: {createdAt: desc}
      ) {
          id
          amount
          createdAt
          path
          object {
              id
              name
              type
          }
        }
      }
    `;

  return graphqlRequest(query);
  
}

// Get user progress data for all activities
export async function getResults() {
    const userInfo = await getUser();
    const userId = userInfo.user[0].id;
    
    const query = `
        query {
            progress(
                where: {userId: {_eq: "${userId}"}}, 
                order_by: {createdAt: desc}
            ) {
                id
                grade
                createdAt
                path
                object {
                    id
                    name
                    type
                }
            }
        }
    `;
    
  return graphqlRequest(query);
}