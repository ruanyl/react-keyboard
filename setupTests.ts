import 'jest-enzyme'
import EnzymeAdapter from 'enzyme-adapter-react-16'
import * as Enzyme from 'enzyme'

Enzyme.configure({ adapter: new EnzymeAdapter() });
