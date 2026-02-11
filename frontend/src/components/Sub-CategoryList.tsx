import TopNavbar from './TopNavbar';

const SubCategoryList = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-8 flex items-center justify-center">
        <h1 className="text-2xl font-black text-zinc-300 uppercase tracking-widest">Sub-Category List Component</h1>
      </div>
    </div>
  );
};

export default SubCategoryList;