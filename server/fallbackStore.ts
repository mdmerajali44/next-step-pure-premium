import mongoose from "mongoose";

// Local storage for in-memory database fallback
export const inMemoryStore: Record<string, any[]> = {
  Category: [],
  Product: [],
  User: [],
  Order: [],
  SiteConfig: [],
  WithdrawRequest: [],
  ProductRequest: [],
  ChatSession: []
};

// Helper to populate store on boot
export function populateFallbackStore(
  categories: any[],
  products: any[],
  users: any[],
  siteConfig: any
) {
  if (inMemoryStore.Category.length === 0) {
    inMemoryStore.Category = JSON.parse(JSON.stringify(categories));
  }
  if (inMemoryStore.Product.length === 0) {
    inMemoryStore.Product = JSON.parse(JSON.stringify(products));
  }
  if (inMemoryStore.User.length === 0) {
    inMemoryStore.User = JSON.parse(JSON.stringify(users));
  }
  if (inMemoryStore.SiteConfig.length === 0) {
    inMemoryStore.SiteConfig = [JSON.parse(JSON.stringify(siteConfig))];
  }
}

// Simple query engine matching filter fields
function matchesFilter(item: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, val] of Object.entries(filter)) {
    if (val && typeof val === 'object') {
      // Support basic nested or direct values
      continue;
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

// Chainable mock query builder supporting sort and limit
class MockQuery<T> {
  private data: T[];
  constructor(data: T[]) {
    this.data = data;
  }
  sort(sortOption: any) {
    if (sortOption) {
      const entries = Object.entries(sortOption);
      if (entries.length > 0) {
        const [key, order] = entries[0];
        this.data.sort((a: any, b: any) => {
          const valA = a[key];
          const valB = b[key];
          if (typeof valA === 'string' && typeof valB === 'string') {
            return order === -1 ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return order === -1 ? (valB - valA) : (valA - valB);
        });
      }
    }
    return this;
  }
  limit(n: number) {
    this.data = this.data.slice(0, n);
    return this;
  }
  then(resolve: (res: T[]) => void, reject: (err: any) => void) {
    resolve(this.data);
  }
}

// Helper to wrap returned document with .save() method
function wrapDoc(modelName: string, doc: any) {
  if (!doc) return null;
  
  // Ensure the document maintains references to update in-place in array
  Object.defineProperty(doc, 'save', {
    value: async function() {
      // Document updates itself in-place since it is a reference to the store item
      return this;
    },
    writable: true,
    configurable: true,
    enumerable: false
  });
  return doc;
}

// Perform findOneAndUpdate mimicking Mongo operator updates
function findOneAndUpdateMock(modelName: string, filter: any, update: any) {
  const arr = inMemoryStore[modelName];
  let doc = arr.find(item => matchesFilter(item, filter));
  
  if (!doc) {
    // If updating config and it doesn't exist yet, we create it
    if (modelName === 'SiteConfig') {
      doc = JSON.parse(JSON.stringify(update));
      arr.push(doc);
      return wrapDoc(modelName, doc);
    }
    return null;
  }
  
  if (update.$push) {
    for (const [key, val] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[key])) doc[key] = [];
      doc[key].push(val);
    }
  }
  if (update.$set) {
    for (const [key, val] of Object.entries(update.$set)) {
      doc[key] = val;
    }
  }
  // Standard non-operator update
  if (!update.$push && !update.$set) {
    for (const [key, val] of Object.entries(update)) {
      doc[key] = val;
    }
  }
  
  return wrapDoc(modelName, doc);
}

// Factory to create mock model interfaces
export function createMockModel(modelName: string) {
  return {
    countDocuments: async (filter?: any) => {
      const arr = inMemoryStore[modelName];
      return arr.filter(item => matchesFilter(item, filter)).length;
    },
    find: (filter?: any) => {
      const arr = inMemoryStore[modelName];
      const matched = arr.filter(item => matchesFilter(item, filter));
      const cloned = JSON.parse(JSON.stringify(matched));
      return new MockQuery(cloned);
    },
    findOne: async (filter?: any) => {
      const arr = inMemoryStore[modelName];
      const found = arr.find(item => matchesFilter(item, filter));
      return wrapDoc(modelName, found);
    },
    create: async (docData: any) => {
      const arr = inMemoryStore[modelName];
      const doc = JSON.parse(JSON.stringify(docData));
      arr.push(doc);
      return wrapDoc(modelName, doc);
    },
    insertMany: async (docs: any[]) => {
      const arr = inMemoryStore[modelName];
      const clonedDocs = JSON.parse(JSON.stringify(docs));
      arr.push(...clonedDocs);
      return clonedDocs.map((doc: any) => wrapDoc(modelName, doc));
    },
    findOneAndUpdate: async (filter: any, update: any, options?: any) => {
      return findOneAndUpdateMock(modelName, filter, update);
    },
    findOneAndDelete: async (filter: any) => {
      const arr = inMemoryStore[modelName];
      const index = arr.findIndex(item => matchesFilter(item, filter));
      if (index !== -1) {
        const [deleted] = arr.splice(index, 1);
        return deleted;
      }
      return null;
    }
  };
}

// Proxy wrapper dynamically routing to live Mongo or in-memory fallback
export function makeDynamicModelProxy(modelName: string, actualModel: any) {
  const mockModel = createMockModel(modelName);
  return new Proxy(actualModel, {
    get(target, prop, receiver) {
      const isConnected = mongoose.connection.readyState === 1;
      const source = isConnected ? target : mockModel;
      const value = Reflect.get(source, prop);
      
      if (typeof value === 'function') {
        return value.bind(source);
      }
      return value;
    }
  });
}
