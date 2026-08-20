// Node for Doubly Linked list
class LRUNode<K, V> {
  key: K;
  value: V;
  
  next: LRUNode<K, V> | null = null;
  prev: LRUNode<K, V> | null = null;
  constructor(key: K, value: V){
    this.key = key;
    this.value = value;
  }
}

export type MetaOptions = {
  persitent?: boolean;
  key: string
}

export class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, LRUNode<K,V>>();

  private head: LRUNode<K, V>
  private tail: LRUNode<K, V>

  private meta: MetaOptions | undefined;

  constructor(capacity: number, options?: MetaOptions){
    this.capacity = capacity;
    this.meta = options;
    
    this.head = new LRUNode<K, V>(null as K, null as V);
    this.tail = new LRUNode<K, V>(null as K, null as V);

    this.head.next = this.tail;
    this.tail.prev = this.head;

    if(this.meta?.persitent){
      const metaItem = localStorage.getItem(`meta-options-${this.meta.key}`);
      if(!metaItem){
        localStorage.setItem(`meta-options-${this.meta.key}`, JSON.stringify(this.meta));
      }
    }
    this.loadFromStorage();
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if(!node) return undefined;

    this.removeNode(node);
    this.addToFront(node);
    return node.value;
  }

  getAll(): V[] {
    return Array.from(this.map.values()).map(n => n.value);
  }

  set(key: K, value: V): V{
    const node = this.map.get(key);
    if(node){
      node.value = value;
      this.removeNode(node);
      this.addToFront(node);
      this.map.set(key, node);

      this.saveToStorage();
      return node.value;
    }

    const newNode = new LRUNode(key, value);

    if(this.map.size >= this.capacity){
      const toBeDeleted = this.tail.prev!;
      this.removeNode(this.tail.prev!);
      this.map.delete(toBeDeleted.key);
    }

    this.addToFront(newNode);
    this.map.set(key, newNode);
    this.saveToStorage();

    return newNode.value;
  }

  private addToFront(node: LRUNode<K, V>){
    node.next = this.head.next;
    node.prev = this.head;

    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>){
    node.prev!.next = node.next;
    node.next!.prev = node.prev;

    node.next = null;
    node.prev = null;
  }

  private saveToStorage(){
    if(!this.meta?.persitent) return;

    let current = this.head.next;
    const entries: Array<[K, V]> = [];
    while(current && current.next != this.tail){
      entries.push([current.key, current.value]);
      current = current.next;
    }
    localStorage.setItem(`meta-map-${this.meta.key}`, JSON.stringify(entries));
  }

  private loadFromStorage(){
    if(!this.meta?.persitent) return;

    const raw = localStorage.getItem(`meta-map-${this.meta.key}`);
    if(!raw) return;

    const entries: Array<[K, V]> = JSON.parse(raw);
    for(let i = entries.length - 1; i >=0 ; i--){
      const [key, value] = entries[i];
      const node = new LRUNode(key, value);
      this.addToFront(node);
      this.map.set(key, node);
    }
  }
}