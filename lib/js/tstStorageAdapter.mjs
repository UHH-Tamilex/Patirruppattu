/** */
export default class TSTStorageAdapter {
  /** */
  constructor(annotationPageId,annoMap) {
    this.annotationPageId = annotationPageId;
    this.annoMap = annoMap;
    this.allAnnotations = {
            id: this.annotationPageId,
            items: [],
            type: 'AnnotationPage'
        };
  }

  /** */
  async create(annotation) {
    const annotationPage = await this.all() || this.allAnnotations;
    annotationPage.items.push(annotation);
    this.annoMap.set(this.annotationPageId,annotationPage);
    return annotationPage;
  }

  /** */
  async update(annotation) {
    const annotationPage = await this.all();
    if (annotationPage) {
      const currentIndex = annotationPage.items.findIndex((item) => item.id === annotation.id);
      annotationPage.items.splice(currentIndex, 1, annotation);
      this.annoMap.set(this.annotationPageId,annotationPage);
      return annotationPage;
    }
    return null;
  }

  /** */
  async delete(annoId) {
    const annotationPage = await this.all();
    if (annotationPage) {
      annotationPage.items = annotationPage.items.filter((item) => item.id !== annoId);
      this.annoMap.set(this.annotationPageId,annotationPage);
    }
    return annotationPage;
  }

  /** */
  async get(annoId) {
    const annotationPage = await this.all();
    if (annotationPage) {
      return annotationPage.items.find((item) => item.id === annoId);
    }
    return null;
  }

  /** */
  async all() {
    return this.annoMap.get(this.annotationPageId);
    //return JSON.parse(localStorage.getItem(this.annotationPageId));
  }
}
