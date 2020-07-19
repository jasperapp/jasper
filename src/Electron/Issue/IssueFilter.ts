import {GitHubQueryParser} from '../../GitHub/GitHubQueryParser';

export class IssueFilter {
  // ---- filter ----
  // number:123 number:456
  // is:issue is:pr type:issue type:pr
  // is:open is:closed
  // is:read is:unread
  // is:star is:unstar
  // author:foo
  // assignee:foo
  // user:foo org:foo
  // repo:foo/bar
  // label:foo label:bar
  // milestone:foo
  // no:label no:milestone no:assignee no:dueon
  // have:label have:milestone have:assignee have:dueon
  // ---- sort ----
  // sort:number
  // sort:type
  // sort:read
  // sort:updated
  // sort:created
  // sort:closed
  // sort:archived
  // sort:star
  // sort:author
  // sort:assignee
  // sort:user
  // sort:repo
  // sort:milestone
  // sort:dueon
  // sort:title
  // single syntax `sort:created`
  // order syntax  `sort:"created desc"
  // multi syntax  `sort:author,created` (multi column sort does not work database index, so slow query)
  // full syntax   `sort:"author desc, created asc"`
  buildCondition(filterQuery) {
    if (!filterQuery) return {};

    const conditions = [];
    const {positive: positiveMap, negative: negativeMap} = GitHubQueryParser.parse(filterQuery);

    if (positiveMap.sort) {
      const temp = this._buildSortCondition(positiveMap.sort);
      positiveMap.sort = temp.sort;
      if (temp.filter) conditions.push(temp.filter);
    }

    conditions.push(...this._buildPositiveFilterCondition(positiveMap));
    conditions.push(...this._buildNegativeFilterCondition(negativeMap));

    if (positiveMap.keywords.length) {
      const tmp = [];
      for (const keyword of positiveMap.keywords) {
        tmp.push(`(
          title like "%${keyword}%"
          or body like "%${keyword}%"
          or user like "%${keyword}%"
          or repo like "%${keyword}%"
          or author like "%${keyword}%"
          or assignees like "%${keyword}%"
          or labels like "%${keyword}%"
          or milestone like "%${keyword}%"
        )`);
      }
      const value = tmp.join(' and ');
      conditions.push(`(${value})`);
    }

    return {
      filter: conditions.join(' and '),
      sort: positiveMap.sort
    };
  }

  _buildPositiveFilterCondition(filterMap) {
    const conditions = [];
    if (filterMap.is.issue) conditions.push('type = "issue"');
    if (filterMap.is.pr) conditions.push('type = "pr"');
    if (filterMap.is.open) conditions.push('closed_at is null');
    if (filterMap.is.closed) conditions.push('closed_at is not null');
    if (filterMap.is.read) conditions.push('(read_at is not null and read_at >= updated_at)');
    if (filterMap.is.unread) conditions.push('(read_at is null or read_at < updated_at)');
    if (filterMap.is.star) conditions.push('marked_at is not null');
    if (filterMap.is.unstar) conditions.push('marked_at is null');

    if (filterMap.no.label) conditions.push('labels is null');
    if (filterMap.no.milestone) conditions.push('milestone is null');
    if (filterMap.no.assignee) conditions.push('assignees is null');
    if (filterMap.no.dueon) conditions.push('due_on is null');

    if (filterMap.have.label) conditions.push('labels is not null');
    if (filterMap.have.milestone) conditions.push('milestone is not null');
    if (filterMap.have.assignee) conditions.push('assignees is not null');
    if (filterMap.have.dueon) conditions.push('due_on is not null');

    if (filterMap.numbers.length) {
      conditions.push(`(number is not null and number in (${filterMap.numbers.join(',')}))`);
    }

    if (filterMap.authors.length) {
      const value = filterMap.authors.map((author) => `"${author}"`).join(',');
      conditions.push(`(author is not null and lower(author) in (${value}))`);
    }

    if (filterMap.assignees.length) {
      // hack: assignee format
      const value = filterMap.assignees.map((assignee)=> `assignees like "%<<<<${assignee}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap.milestones.length) {
      const value = filterMap.milestones.map((milestone) => `"${milestone}"`).join(',');
      conditions.push(`(milestone is not null and lower(milestone) in (${value}))`);
    }

    if (filterMap.users.length) {
      const value = filterMap.users.map((user) => `"${user}"`).join(',');
      conditions.push(`(user is not null and lower(user) in (${value}))`);
    }

    if (filterMap.repos.length) {
      const value = filterMap.repos.map((repo) => `"${repo}"`).join(',');
      conditions.push(`(repo is not null and lower(repo) in (${value}))`);
    }

    if (filterMap.labels.length) {
      // hack: label format
      const value = filterMap.labels.map((label)=> `labels like "%<<<<${label}>>>>%"`).join(' and ');
      conditions.push(`(${value})`);
    }

    return conditions;
  }

  _buildNegativeFilterCondition(filterMap) {
    const conditions = [];
    if (filterMap.is.issue) conditions.push('type != "issue"');
    if (filterMap.is.pr) conditions.push('type != "pr"');
    if (filterMap.is.open) conditions.push('closed_at is not null');
    if (filterMap.is.closed) conditions.push('closed_at is null');
    if (filterMap.is.read) conditions.push('(read_at is null or read_at < updated_at)');
    if (filterMap.is.unread) conditions.push('(read_at is not null and read_at >= updated_at)');
    if (filterMap.is.star) conditions.push('marked_at is null');
    if (filterMap.is.unstar) conditions.push('marked_at is not null');

    if (filterMap.no.label) conditions.push('labels is not null');
    if (filterMap.no.milestone) conditions.push('milestone is not null');
    if (filterMap.no.assignee) conditions.push('assignees is not null');
    if (filterMap.no.dueon) conditions.push('due_on is not null');

    if (filterMap.have.label) conditions.push('labels is null');
    if (filterMap.have.milestone) conditions.push('milestone is null');
    if (filterMap.have.assignee) conditions.push('assignees is null');
    if (filterMap.have.dueon) conditions.push('due_on is null');

    if (filterMap.numbers.length) {
      conditions.push(`number is not null and number not in (${filterMap.numbers.join(',')})`);
    }

    if (filterMap.authors.length) {
      const value = filterMap.authors.map((author) => `"${author}"`).join(',');
      conditions.push(`(author is not null and lower(author) not in (${value}))`);
    }

    if (filterMap.assignees.length) {
      // hack: assignee format
      const value = filterMap.assignees.map((assignee)=> `assignees not like "%<<<<${assignee}>>>>%"`).join(' and ');
      conditions.push(`(${value})`);
    }

    if (filterMap.milestones.length) {
      const value = filterMap.milestones.map((milestone) => `"${milestone}"`).join(',');
      conditions.push(`(milestone is not null and lower(milestone) not in (${value}))`);
    }

    if (filterMap.users.length) {
      const value = filterMap.users.map((user) => `"${user}"`).join(',');
      conditions.push(`(user is not null and lower(user) not in (${value}))`);
    }

    if (filterMap.repos.length) {
      const value = filterMap.repos.map((repo) => `"${repo}"`).join(',');
      conditions.push(`(repo is not null and lower(repo) not in (${value}))`);
    }

    if (filterMap.labels.length) {
      // hack: label format
      const value = filterMap.labels.map((label)=> `labels not like "%<<<<${label}>>>>%"`).join(' and ');
      conditions.push(`(${value})`);
    }

    return conditions;

  }

  // sort:number
  // sort:type
  // sort:read
  // sort:updated
  // sort:created
  // sort:closed
  // sort:archived
  // sort:star
  // sort:author
  // sort:assignee
  // sort:user
  // sort:repo
  // sort:milestone
  // sort:dueon
  // sort:title
  // value is 'number desc, updated asc'
  _buildSortCondition(value) {
    const conditions = [];
    const filterConditions = [];
    const sortConditions = value.split(',').map((v)=> v.trim());
    for (const sortCondition of sortConditions) {
      let [column, order] = sortCondition.split(/\s+/);
      if (order && order !== 'asc' && order !== 'desc') order = null;

      switch (column) {
        case 'number': conditions.push(`number ${order ? order : 'desc'}`); break;
        case 'type': conditions.push(`type ${order ? order : 'asc'}`); break;
        case 'read': conditions.push(`read_at ${order ? order : 'desc'}`); break;
        case 'updated': conditions.push(`updated_at ${order ? order : 'desc'}`); break;
        case 'created': conditions.push(`created_at ${order ? order : 'desc'}`); break;
        case 'closed': conditions.push(`closed_at ${order ? order : 'desc'}`); break;
        case 'archived': conditions.push(`archived_at ${order ? order : 'desc'}`); break;
        case 'star': conditions.push(`marked_at ${order ? order : 'desc'}`); break;
        case 'author': conditions.push(`author ${order ? order : 'asc'}`); break;
        case 'assignee': conditions.push(`assignee ${order ? order : 'asc'}`); break;
        case 'user': conditions.push(`user ${order ? order : 'asc'}`); break;
        case 'repo': conditions.push(`repo ${order ? order : 'asc'}`); break;
        case 'milestone': conditions.push(`milestone ${order ? order : 'desc'}`); break;
        case 'dueon':
          conditions.push(`due_on ${order ? order : 'asc'}`);
          filterConditions.push('closed_at is null');
          filterConditions.push('due_on is not null');
          break;
        case 'title': conditions.push(`title ${order ? order : 'asc'}`); break;
      }
    }

    return {
      sort: conditions.join(' , '),
      filter: filterConditions.join(' and ')
    };
  }
}

export default new IssueFilter();
