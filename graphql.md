query MyQuery {
  checkSearch(searchTerm: "") {
    checkNumber
    commission
    commissionMonth
    createdBy
    creationType
    entityDate
    entryDate
    factoryId
    id
    postDate
    status
    userOwnerIds
  }
}

query MyQuery {
  company(id: "") {
    createdBy {
      email
      firstName
      fullName
      id
      lastName
    }
    companySourceType
    createdAt
    id
    name
    parentCompanyId
    phone
    tags
    website
  }
}

query MyQuery {
  companySearch(searchTerm: "") {
    companySourceType
    createdAt
    createdBy {
      email
      firstName
      fullName
      id
      lastName
    }
    id
    name
    parentCompanyId
    phone
    tags
    website
  }
}
query MyQuery {
  contact(id: "") {
    companyId
    createdAt
    email
    firstName
    id
    lastName
    notes
    phone
    role
    tags
    territory
  }
}

query MyQuery {
  contactSearch(searchTerm: "") {
    createdAt
    email
    firstName
    id
    lastName
    notes
    phone
    role
    territory
    tags
  }
}
query MyQuery {
  contactsByCompany(companyId: "") {
    companyId
    createdAt
    email
    firstName
    id
    lastName
    notes
    phone
    role
    tags
    territory
  }
}

query MyQuery {
  customerSearch(searchTerm: "", published: false) {
    companyName
    id
    insideRepId
    parentId
  }
}

query MyQuery {
  factorySearch(searchTerm: "", published: false) {
    id
    title
  }
}

